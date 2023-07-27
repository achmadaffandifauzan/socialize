const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/user');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isGuest, validateUser, reqBodySanitize } = require('../middleware');
const ExpressError = require('../utils/ExpressError');
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });
const dayjs = require('dayjs');

// https://mongoosejs.com/docs/tutorials/findoneandupdate.html
// REMINDER
// - const user = await User.findByIdAndUpdate() -> user dont store latest date but data in mongodb updated
// - await User.findByIdAndUpdate() -> data in mongodb updated
// - const user = await User.findOneAndUpdate(filter,update,{new:true}) -> user store latest data and data in mongodb updated
// - const user = await User.findOneAndUpdate(filter,update) -> user dont store latest data but data in mongodb updated
// - await User.findOneAndUpdate() -> ? (somehow in loop doesn't work, proven in sekawan project -> setWeight router)

router.get('/users/register', isGuest, (req, res) => {
    res.render('users/register');
})
router.post('/users/register', isGuest, reqBodySanitize, upload.fields([{ name: 'user[profilePicture]', maxCount: 1 }, { name: 'user[backgroundPicture]', maxCount: 1 }]), validateUser, catchAsync(async (req, res, next) => {
    try {
        const { email, username, name, password } = req.body.user;
        // const { profilePicture, backgroundPicture } = req.files;
        // console.log(req.files);
        const newUser = new User({ email, username, name });
        if (req.files['user[profilePicture]']) {
            newUser.profilePicture = {
                url: req.files['user[profilePicture]'][0]['path'],
                filename: req.files['user[profilePicture]'][0]['filename']
            }
            newUser.profilePicture.thumb = newUser.profilePicture.url.replace('/upload', '/upload/w_200');
        };
        if (req.files['user[backgroundPicture]']) {
            newUser.backgroundPicture = {
                url: req.files['user[backgroundPicture]'][0]['path'],
                filename: req.files['user[backgroundPicture]'][0]['filename']
            }
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
        res.redirect('/users/register');
    }
}));
router.get('/users/login', isGuest, (req, res) => {
    res.render('users/login');
})
router.post('/users/login', isGuest, reqBodySanitize, passport.authenticate('local',
    { failureFlash: true, failureRedirect: '/users/login', keepSessionInfo: true }),
    catchAsync(async (req, res, next) => {
        req.flash('success', 'Welcome Back!');
        const redirectUrl = req.session.lastPath || '/posts';
        delete req.session.lastPath;
        res.redirect(redirectUrl);

    }));

router.get('/users/:id/edit', isLoggedIn, catchAsync(async (req, res, next) => {
    if (!req.user._id.equals(req.params.id)) { // put it on middleware !
        next(new ExpressError('It is not your account!', 401));
    }
    const user = await User.findById(req.params.id);
    res.render('users/edit', { user });
}));
router.put('/users/:id', isLoggedIn, reqBodySanitize, upload.fields([{ name: 'user[profilePicture]', maxCount: 1 }, { name: 'user[backgroundPicture]', maxCount: 1 }]), validateUser, catchAsync(async (req, res, next) => {
    if (!req.user._id.equals(req.params.id)) { // put it on middleware !
        next(new ExpressError('It is not your account!', 401));
    }
    const user = await User.findOneAndUpdate({ _id: req.params.id }, req.body.user, { new: true });
    if (req.body.user.newpassword) {
        user.changePassword(req.body.user.password, req.body.user.newpassword,
            function (err) {
                if (err) {
                    next(new ExpressError());
                }
            })
    }
    if (req.body.deleteProfilePictureFilename) {
        const picFileName = req.body.deleteProfilePictureFilename;
        await cloudinary.uploader.destroy(picFileName);
        await User.updateOne({ _id: req.user.id }, { $unset: { 'profilePicture': 1 } });
    }
    if (req.body.deleteBackgroundPictureFilename) {
        const picFileName = req.body.deleteBackgroundPictureFilename;
        await cloudinary.uploader.destroy(picFileName);
        await User.updateOne({ _id: req.user.id }, { $unset: { 'backgroundPicture': 1 } });
    }

    if (req.files['user[profilePicture]']) {
        if (user.profilePicture) {
            // check first in case user dont have any profilepic
            await cloudinary.uploader.destroy(user.profilePicture.filename);
        }
        user.profilePicture = {
            url: req.files['user[profilePicture]'][0]['path'],
            filename: req.files['user[profilePicture]'][0]['filename']
        }
    };
    if (req.files['user[backgroundPicture]']) {
        if (user.profilePicture) {
            await cloudinary.uploader.destroy(user.profilePicture.filename);
        }
        user.backgroundPicture = {
            url: req.files['user[backgroundPicture]'][0]['path'],
            filename: req.files['user[backgroundPicture]'][0]['filename']
        }
    };


    user.save();
    req.flash('success', 'Successfully updated account!')
    res.redirect(`/users/${req.params.id}`);
}))


router.post('/users/requestFriend/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    const { currentId, friendId } = req.params;
    const user = await User.findById(currentId);
    const user2 = await User.findById(friendId);
    if (user.friendRequests.includes(user2._id)) {
        // if one is already send req, another can't
        req.flash('error', `${user2.name} already in your friend requests`);
        return res.redirect(`/users/${currentId}`);
    };
    user2.friendRequests.push(currentId);
    await user2.save()
    res.redirect(`/users/${friendId}`);
}))
router.post('/users/cancelRequestFriend/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    // (if) case : click cancel req friend before refreshing page while other already accept it -> won't error because findByIdAndUpdate wont error if $pull doesn't find anything
    const { currentId, friendId } = req.params;
    await User.findByIdAndUpdate(friendId, { $pull: { friendRequests: currentId } });
    res.redirect(`/users/${friendId}`);
}))
router.post('/users/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    const { currentId, friendId } = req.params;
    const user = await User.findById(currentId);
    const user2 = await User.findById(friendId);
    user.friends.push(friendId);
    user2.friends.push(currentId);
    await User.findByIdAndUpdate(currentId, { $pull: { friendRequests: friendId } });
    await user.save()
    await user2.save()
    res.redirect(`/users/${friendId}`);
}))
router.delete('/users/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
    // (if) case : click delete friend before refreshing page while other already deleted it -> won't error because findByIdAndUpdate wont error if $pull doesn't find anything
    const { currentId, friendId } = req.params;
    await User.findByIdAndUpdate(currentId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: currentId } });
    res.redirect(`/users/${friendId}`);
}))
router.get('/users/logout', isLoggedIn, catchAsync(async (req, res, next) => {
    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");
    await User.findByIdAndUpdate(req.user._id,
        { lastOnline: `${currentTime} - ${currentDate}` });
    req.logout(async (error) => {
        if (error) return next(error)
        req.flash('success', "You're Logged Out!");
        res.redirect('/posts');
    });
}))

router.get('/users/:userId/', catchAsync(async (req, res, next) => {
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
// router.get('/users/:friendId/:currentId', isLoggedIn, catchAsync(async (req, res, next) => {
//     const { currentId, friendId } = req.params;
//     const user = await User.findById(friendId).populate('posts');
//     const currentUser = await User.findById(currentId);
//     const isFriend = currentUser.friends.include(user._id) ? true : false;
//     res.render('users/show', { user, isFriend })
// }))

module.exports = router;