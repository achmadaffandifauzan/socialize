const express = require('express');
const router = express.Router({ mergeParams: true });
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, isCommentAuthor, validateComment } = require('../middleware');
const dayjs = require('dayjs');



router.get('/chat/:senderId/:receiverId', isLoggedIn, catchAsync(async (req, res, next) => {
    const sender = await User.findById(req.params.senderId);
    const receiver = await User.findById(req.params.receiverId);
    if (sender._id.equals(receiver._id)) {
        req.flash('error', 'Unfortunately, you cannot have a chat with yourself for now.');
        res.redirect(`/${sender._id}`)
    };
    var chat = await Chat.findOne({ authors: { $all: [sender._id, receiver._id] } }).populate('messages');

    res.render('users/chat', { sender, receiver, chat });
}))
router.get('/:id/chats', isLoggedIn, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id)
    const chat = await Chat.find({ authors: { $all: [user._id] } }).populate('authors').populate('messages');

    res.render('users/inbox', { user, chat });
}))
router.post('/chat/:senderId/:receiverId', isLoggedIn, catchAsync(async (req, res, next) => {
    const sender = await User.findById(req.params.senderId);
    const receiver = await User.findById(req.params.receiverId);

    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");

    const message = new Message(req.body)
    message.author = sender._id;
    message.acceptor = receiver._id;
    message.dateCreated = `${currentTime} - ${currentDate}`;
    await message.save();

    var chat = await Chat.findOne({ authors: { $all: [sender._id, receiver._id] } });
    if (!chat) {
        var chat = new Chat();
        chat.dateCreated = `${currentTime} - ${currentDate}`;
        chat.authors.push(sender._id, receiver._id)
    }
    chat.messages.push(message._id);
    chat.dateUpdated = `${currentTime} - ${currentDate}`;
    await chat.save()

    res.redirect(`/chat/${sender._id}/${receiver._id}`);
}))

module.exports = router;