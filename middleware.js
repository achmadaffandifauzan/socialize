const { postSchema, commentSchema } = require("./joiSchemas");
const Post = require('./models/post');
const Comment = require('./models/comment');
const catchAsync = require('./utils/CatchAsync');
const ExpressError = require('./utils/ExpressError');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.lastPath = req.originalUrl;
        console.log(req.query._method)
        if (req.query._method === 'DELETE') { req.session.lastPath = '/posts'; } //prevent error because redirecting on link with post / delete / put method create an error
        req.flash('error', "You're not logged in!");
        return res.redirect('/login');
    }
    next();
}

module.exports.isPostAuthor = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
    if (post.author.equals(req.user._id)) {
        next();
    } else {
        req.flash('error', "You don't have permission to do that!");
        res.redirect(`/posts/${req.params.id}`)
    }
})
module.exports.isCommentAuthor = catchAsync(async (req, res, next) => {
    const { id, commentId } = req.params;
    const comment = await Comment.findById(commentId)
    if (comment.author.equals(req.user._id)) {
        next();
    } else {
        req.flash('error', "You don't have permission to do that!");
        res.redirect(`/posts/${id}`)
    }
})
module.exports.validatePost = (req, res, next) => {
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
module.exports.validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        // mapping error(s) then joining them to single array of single string
        const messageErr = error.details.map(x => x.message).join(',');
        throw new ExpressError(messageErr, 400);
    } else {
        next();
    }
}

