if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require("express");
const mongoose = require('mongoose');
const path = require('path');
const morgan = require('morgan');
const ejsMate = require('ejs-mate');
const methorOverride = require('method-override');
const catchAsync = require('./utils/CatchAsync');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

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

const app = express();

const server = require('http').createServer(app);
const io = require("socket.io")(server);


// // Make io accessible to our router
// app.use(function (req, res, next) {
//     req.io = io;
//     next();
// });

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
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

const Chat = require('./models/chat');
const Message = require('./models/message');
const { isLoggedIn, validateMessage, reqBodySanitize } = require('./middleware');
const dayjs = require('dayjs');
app.post('/chat/:chatId/:receiverId', isLoggedIn, reqBodySanitize, validateMessage, catchAsync(async (req, res, next) => {
    const receiver = await User.findById(req.params.receiverId);
    if (!receiver) {
        req.flash('error', 'No user found!.');
        return res.redirect(`/${req.user._id}/chats`);
    }
    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");
    var chat = await Chat.findById(req.params.chatId);
    if (!chat) {
        var chat = new Chat();
        chat.dateCreated = `${currentTime} - ${currentDate}`;
        chat.authors.push(req.user._id, req.params.receiverId);
    }
    const message = new Message(req.body)
    message.author = req.user._id;
    message.acceptor = receiver._id;
    message.dateCreated = `${currentTime} - ${currentDate}`;
    await message.save();

    chat.messages.push(message._id);
    chat.dateUpdated = `${currentTime} - ${currentDate}`;
    await chat.save()

    const chatId = chat._id;

    io.emit(`room-chatId-${chatId}`, ({ chatId }))

    res.redirect(`/chat/${chat._id}`);
}));

app.use('/', postsRoutes);
app.use('/posts/:id/comments', commentsRoutes);
app.use('/', chatRoutes);
app.use('/', userRoutes);


app.all('*', (req, res, next) => {
    next(new ExpressError('Not Found!', 404))
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', { err });
})
const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT} ~express`));
// io.on('connection', (socket) => {
//     socket.on('message', (message) => {
//         console.log(message)
//     })
// });

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} ~express and socket io`);
});


