const express = require('express');
const router = express.Router({ mergeParams: true });
const Comment = require('../models/comment');
const Post = require('../models/post');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isCommentAuthor, validateComment } = require('../middleware');
const dayjs = require('dayjs');

router.post('/', isLoggedIn, validateComment, catchAsync(async (req, res, next) => {
    const postDB = await Post.findById(req.params.id);
    const comment = new Comment(req.body.comment);
    comment.author = req.user._id;
    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");
    comment.dateCreated = `${currentTime} - ${currentDate}`;
    postDB.comments.push(comment);
    await comment.save();
    await postDB.save();
    res.redirect(`/posts/${postDB._id}`);
}))
router.delete('/:commentId', isLoggedIn, isCommentAuthor, catchAsync(async (req, res, next) => {
    const { id, commentId } = req.params;
    await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });
    await Comment.findByIdAndDelete(commentId);
    res.redirect(`/posts/${id}`);
}));

module.exports = router;