const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/user');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isGuest } = require('../middleware');
const ExpressError = require('../utils/ExpressError');
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });
const dayjs = require('dayjs');
const { equal } = require('joi');

router.get('/register', isGuest, (req, res) => {
    res.render('users/register');
})
router.post('/register', isGuest, upload.fields([{ name: 'user[profilePicture]', maxCount: 1 }, { name: 'user[backgroundPicture]', maxCount: 1 }]), catchAsync(async (req, res, next) => {
    try {
        const { email, username, name, password } = req.body.user;
        // const { profilePicture, backgroundPicture } = req.files;
        // console.log(req.files);
        const newUser = new User({ email, username, name });

        newUser.profilePicture = {
            url: req.files['user[profilePicture]'][0]['path'],
            filename: req.files['user[profilePicture]'][0]['filename']
        };
        newUser.backgroundPicture = {
            url: req.files['user[backgroundPicture]'][0]['path'],
            filename: req.files['user[backgroundPicture]'][0]['filename']
        };
        const registeredUser = await User.register(newUser, password);

        const currentTime = dayjs().format("HH:mm");
        const currentDate = dayjs().format("D MMM YY");
        newUser.dateCreated = `${currentTime} - ${currentDate}`;
        // console.log(newUser)
        await newUser.save();
        req.login(registeredUser, (error) => {
            if (error) return next(error);
            req.flash('success', 'Successfully Registered!');
            res.redirect('/posts');
        })

    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/register');
    }
}));
router.get('/login', isGuest, (req, res) => {
    res.render('users/login');
})
router.post('/login', isGuest, passport.authenticate('local',
    { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true }),
    catchAsync(async (req, res, next) => {
        req.flash('success', 'Welcome Back!');
        const redirectUrl = req.session.lastPath || '/posts';
        delete req.session.lastPath;
        res.redirect(redirectUrl);
    }));
router.post('/requestFriend/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    const { currentId, friendId } = req.params;
    const user = await User.findById(friendId);
    user.friendRequests.push(currentId);
    await user.save()
    res.redirect(`/${friendId}`);
}))
router.post('/cancelRequestFriend/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    const { currentId, friendId } = req.params;
    await User.findByIdAndUpdate(friendId, { $pull: { friendRequests: currentId } });
    res.redirect(`/${friendId}`);
}))
router.post('/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    const { currentId, friendId } = req.params;
    const user = await User.findById(currentId);
    user.friends.push(friendId);
    const user2 = await User.findById(friendId);
    user2.friends.push(currentId);
    await User.findByIdAndUpdate(currentId, { $pull: { friendRequests: friendId } });
    await user.save()
    await user2.save()
    res.redirect(`/${friendId}`);
}))
router.delete('/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    const { currentId, friendId } = req.params;
    const user = await User.findByIdAndUpdate(currentId, { $pull: { friends: friendId } });
    const user2 = await User.findByIdAndUpdate(friendId, { $pull: { friends: currentId } });
    await user.save()
    await user2.save()
    res.redirect(`/${friendId}`);
}))
router.get('/logout/:userId', isLoggedIn, catchAsync(async (req, res, next) => {
    req.logout(async (error) => {
        if (error) return next(error)
        const currentTime = dayjs().format("HH:mm");
        const currentDate = dayjs().format("D MMM YY");
        await User.updateOne(
            { id: req.params.userId },
            { lastOnline: `${currentTime} - ${currentDate}` });
        req.flash('success', "You're Logged Out!");
        res.redirect('/posts');
    });
}))
// dont forget to change to user/:userId/ later
router.get('/:userId/', catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    let user = await User.findById(userId).populate('posts').populate('friendRequests').populate('friends');
    const currentUser = req.user;
    if (currentUser && currentUser._id.equals(userId) == false) {
        const user2 = await User.findById(currentUser._id);
        const isFriend = user2.friends.includes(user._id) ? true : false;
        let isRequestingFriend = await User.findById(
            req.params.userId).where('friendRequests').equals(req.user._id);
        (isRequestingFriend) ? isRequestingFriend = true : isRequestingFriend = false;
        // why not isRequestingFriend = user.friendRequests.includes(user2._id) ?? because friendRequests.includes wont work if User.find() use populate
        res.render('users/show', { user, isFriend, isRequestingFriend })
    } else {
        res.render('users/show', { user })
    }
}))
// router.get('/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
//     const { currentId, friendId } = req.params;
//     const user = await User.findById(friendId).populate('posts');
//     const currentUser = await User.findById(currentId);
//     const isFriend = currentUser.friends.include(user._id) ? true : false;
//     res.render('users/show', { user, isFriend })
// }))

module.exports = router;