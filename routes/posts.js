const express = require('express');
const router = express.Router({ mergeParams: true });
const Post = require('../models/post');
const User = require('../models/user');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isPostAuthor, validatePost } = require('../middleware');
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });



router.get('/', catchAsync(async (req, res, next) => {
    const posts = await Post.find({}).populate('author');
    res.render('posts/index', { posts })
}))
router.get('/new', isLoggedIn, (req, res) => {
    res.render('posts/new');
})
router.get('/:id', catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
        .populate({ path: 'comments', populate: { path: 'author' } })
        .populate('author');
    if (!post) {
        req.flash('error', "Post doesn't exist");
        return res.redirect('/posts')
    } else {
        res.render('posts/show', { post });
    }
}))
router.get('/:id/edit', isLoggedIn, isPostAuthor, catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        req.flash('error', "Post doesn't exist");
        return res.redirect('/posts')
    } else {
        res.render('posts/edit', { post });
    }
}))
router.post('/', isLoggedIn, upload.array('post[image]'), validatePost, catchAsync(async (req, res, next) => {
    const post = new Post(req.body.post);
    post.images = req.files.map(file => ({ url: file.path, filename: file.filename }));
    post.author = req.user._id;
    const user = await User.findById(req.user._id);
    user.posts.push(post._id);
    await post.save();
    await user.save();
    //console.log(post);
    req.flash('success', 'Successfully made a post!')
    res.redirect(`/posts/${post._id}`);
}))

// router.post('/', upload.array('post[image]'), (req, res,) => {
//     console.log(req.body, req.files);
//     res.send('it worked')
// })
router.put('/:id', isLoggedIn, isPostAuthor, upload.array('post[image]'), validatePost, catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    const imagesArr = req.files.map(file => ({ url: file.path, filename: file.filename }));
    post.images.push(...imagesArr);
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await post.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    post.save();
    //console.log("___________UPDATED____________", post)
    req.flash('success', 'Successfully updated post!')
    res.redirect(`/posts/${id}`);
}))

router.delete('/:id', isLoggedIn, isPostAuthor, catchAsync(async (req, res, next) => {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted post!')
    res.redirect("/posts");
}))

module.exports = router;