if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require("express");
const mongoose = require('mongoose');
const path = require('path');
const ejsMate = require('ejs-mate');
const methorOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const cors = require("cors");
const User = require('./models/user');
const { postMessage } = require('./controllers/chat')

const userRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');
const chatRoutes = require('./routes/chats')

const MongoStore = require('connect-mongo');
const mongoSanitize = require('express-mongo-sanitize');

const dbUrl = process.env.DB_URL;
mongoose.set('strictQuery', true);
mongoose.connect(dbUrl);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => {
    console.log("Database Connected ~mongoose");
})
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);

if (process.env.NODE_ENV !== 'production') {
    var io = socketIO(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });
} else {
    var io = socketIO(server);
}


app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use(express.urlencoded({ extended: true }));
app.use(methorOverride('_method'));
mongoSanitize.sanitize({
    allowDots: true,
    replaceWith: '_'
});

const secret = process.env.SECRET || "asecret";
const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60 // time period in seconds
})
store.on('error', function (e) {
    console.log("SESSION STORE ERROR : ", e)
})
const sessionConfig = {
    store,
    name: 'session',
    secret: 'asecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 2,
        maxAge: 1000 * 60 * 60 * 24
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.rootDirname = __dirname;
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
app.get('/', (req, res) => {
    console.log("AAA")
    res.redirect('/posts');
});
if (process.env.NODE_ENV !== 'production') {
    // Add the cors middleware to allow requests from 'http://localhost:3000'
    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true // If you need to pass cookies or authentication headers
    }));

    app.use(express.static(path.join(__dirname, "client-react-chatpage/public")));
} else {
    app.use(express.static(path.join(__dirname, 'build')));
}


app.get('/api/currentUser', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send({
            message: 'Not authenticated!'
        });
    }
    res.json({ user: req.user }); // Assuming req.user contains the authenticated user information
});
app.use('/', chatRoutes);
app.use('/', postsRoutes);
app.use('/posts/:id/comments', commentsRoutes);
app.use('/', userRoutes);


app.all('*', (req, res, next) => {
    next(new ExpressError('Not Found!', 404))
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', { err });
})

// Socket.io connection event
io.on("connection", (socket) => {
    // console.log("A user connected!");
    // Join a room when a user connects (roomId is passed from client side)
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
    });

    // Listen for messages sent by the client
    socket.on("message", async (message) => {
        // Save the message to the database or perform any other necessary actions
        const savedMessage = await postMessage(message);
        // console.log(savedMessage);
        // Broadcast the message to all connected clients in the room
        io.to(message.roomId).emit("message", savedMessage);
    });

    // When a user disconnects
    socket.on("disconnect", () => {
        // console.log("A user disconnected!");
    });
});

const PORT = process.env.PORT || 3100;


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


