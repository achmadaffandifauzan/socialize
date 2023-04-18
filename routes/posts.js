const express = require('express');
const router = express.Router({ mergeParams: true });
const Post = require('../models/post');
const User = require('../models/user');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isPostAuthor, validatePost } = require('../middleware');
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });
const dayjs = require('dayjs');
const ExpressError = require('../utils/ExpressError');


// https://mongoosejs.com/docs/tutorials/findoneandupdate.html
// REMINDER
// - const user = await User.findByIdAndUpdate() -> user dont store latest date but data in mongodb updated
// - await User.findByIdAndUpdate() -> data in mongodb updated
// - const user = await User.findOneAndUpdate(filter,update,{new:true}) -> user store latest data and data in mongodb updated
// - const user = await User.findOneAndUpdate(filter,update) -> user dont store latest data but data in mongodb updated
// - await User.findOneAndUpdate() -> ? (somehow in loop doesn't work, proven in sekawan project -> setWeight router)



router.get('/', catchAsync(async (req, res, next) => {
    res.redirect('posts');
}))
router.get('/posts', catchAsync(async (req, res, next) => {
    let limit = 10;
    let page = (Math.abs(req.query.page) || 0);
    const posts = await Post.find({}).limit(limit).skip(limit * page).populate('author');
    // console.log(page)
    let pageBefore = (page == 0) ? 0 : page - 1;
    let pageAfter = page + 1;
    res.render('posts/index', { posts, pageBefore, pageAfter })
}))
router.get('/posts/search', catchAsync(async (req, res, next) => {
    //https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
    let limit = Math.abs(req.query.limit) || 10;
    let page = (Math.abs(req.query.page) || 0);
    if (!req.query.q) {
        next(new ExpressError('Not Found!', 404));
    };
    const posts = await Post.find({
        $or:
            [{ "title": { '$regex': req.query.q, $options: 'i' } },
            { "description": { '$regex': req.query.q, $options: 'i' } },
            { "hashtag": { '$regex': req.query.q, $options: 'i' } },
            { "authorName": { '$regex': req.query.q, $options: 'i' } }]
    }).limit(limit).skip(limit * page).populate('author');
    const users = await User.find({
        $or:
            [{ "username": { '$regex': req.query.q, $options: 'i' } },
            { "name": { '$regex': req.query.q, $options: 'i' } },]
    }).limit(limit).skip(limit * page);
    // console.log(page)
    let pageBefore = (page == 0) ? 0 : page - 1;
    let pageAfter = page + 1;
    res.render('posts/search', { posts, users, pageBefore, pageAfter })
}))
router.get('/posts/new', isLoggedIn, (req, res) => {
    res.render('posts/new');
})
router.get('/posts/:id', catchAsync(async (req, res, next) => {
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
router.get('/posts/:id/edit', isLoggedIn, isPostAuthor, catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        req.flash('error', "Post doesn't exist");
        return res.redirect('/posts')
    } else {
        res.render('posts/edit', { post });
    }
}))
router.post('/posts/', isLoggedIn, upload.array('post[image]'), validatePost, catchAsync(async (req, res, next) => {
    const post = new Post(req.body.post);
    post.images = req.files.map(file => ({ url: file.path, filename: file.filename }));
    post.author = req.user._id;
    post.authorName = req.user.name;
    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");
    post.dateCreated = `${currentTime} - ${currentDate}`;
    const user = await User.findById(req.user._id);
    user.posts.push(post._id);
    await post.save();
    await user.save();
    //console.log(post);
    req.flash('success', 'Successfully made a post!')
    res.redirect(`/posts/${post._id}`);
}))

router.put('/posts/:id', isLoggedIn, isPostAuthor, upload.array('post[image]'), validatePost, catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const post = await Post.findByOneAndUpdate({ _id: id }, { ...req.body.post }, { new: true });
    const imagesArr = req.files.map(file => ({ url: file.path, filename: file.filename }));
    post.images.push(...imagesArr);
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await post.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    post.save();
    req.flash('success', 'Successfully updated post!')
    res.redirect(`/posts/${id}`);
}))

router.delete('/posts/:id', isLoggedIn, isPostAuthor, catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const post = await Post.findById(id);
    console.log(post)
    if (post.images.length > 0) {
        for (let image of post.images) {
            await cloudinary.uploader.destroy(image.filename);
        }
    }
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted post!')
    res.redirect("/posts");
}))

module.exports = router;