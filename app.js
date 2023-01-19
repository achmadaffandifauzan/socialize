const express = require("express");
const mongoose = require('mongoose');
const path = require('path');
const morgan = require('morgan');
const ejsMate = require('ejs-mate');
const { postSchema, commentSchema } = require('./joiSchemas')
const Post = require('./models/post');
const methorOverride = require('method-override');
const catchAsync = require('./utils/CatchAsync');
const ExpressError = require('./utils/ExpressError');
const Comment = require('./models/comment');

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/sosmed');

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => {
    console.log("Database Connected ~mongoose");
})

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(methorOverride('_method'));

const validatePost = (req, res, next) => {
    // this joiSchema only catch error if user pass the client side validation anyway (the bootstrap form validation)
    const { error } = postSchema.validate(req.body);
    if (error) {
        // mapping error(s) then joining them to single array of single string
        const messageErr = error.details.map(x => x.message).join(',');
        throw new ExpressError(messageErr, 400);
    } else {
        next();
    }
}
const validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        // mapping error(s) then joining them to single array of single string
        const messageErr = error.details.map(x => x.message).join(',');
        throw new ExpressError(messageErr, 400);
    } else {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home');
})
app.get('/posts', catchAsync(async (req, res, next) => {
    const posts = await Post.find({});
    res.render('posts/index', { posts })
}))
app.get('/posts/new', (req, res) => {
    res.render('posts/new');
})
app.get('/posts/:id', catchAsync(async (req, res, next) => {
    const posts = await Post.findById(req.params.id).populate('comments');
    res.render('posts/show', { posts });
}))
app.get('/posts/:id/edit', catchAsync(async (req, res, next) => {
    const posts = await Post.findById(req.params.id);
    res.render('posts/edit', { posts });
}))
app.put('/posts/:id', validatePost, catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    res.redirect(`/posts/${id}`);
}))
app.post('/posts', validatePost, catchAsync(async (req, res, next) => {
    const post = new Post(req.body.post);
    await post.save();
    res.redirect(`/posts/${post._id}`);
}))
app.post('/posts/:id/comments', validateComment, catchAsync(async (req, res, next) => {
    const postDB = await Post.findById(req.params.id);
    const comment = new Comment(req.body.comment);
    postDB.comments.push(comment);
    await comment.save();
    await postDB.save();
    res.redirect(`/posts/${postDB._id}`);
}))
app.delete('/posts/:id', catchAsync(async (req, res, next) => {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.redirect("/posts");
}))
app.delete('/posts/:id/comments/:cid', catchAsync(async (req, res, next) => {
    const { id, cid } = req.params;
    await Post.findByIdAndUpdate(id, { $pull: { comments: cid } });
    await Comment.findByIdAndDelete(cid);
    res.redirect(`/posts/${id}`);
}));
app.all('*', (req, res, next) => {
    next(new ExpressError('Not Found!', 404))
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', { err });
})
app.listen(3000, () => {
    console.log("CONNECTED TO PORT 3000 ~express");
})