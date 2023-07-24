const express = require('express');

const router = express.Router({ mergeParams: true });
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn, validateMessage, reqBodySanitize } = require('../middleware');
const dayjs = require('dayjs');



router.get('/chat/:chatId/getchat', catchAsync(async (req, res, next) => {
    res.redirect(`/chat/${req.params.chatId}`);
}));
if (process.env.NODE_ENV !== 'production') {
    router.get('/chat/:chatId', catchAsync(async (req, res, next) => {
        try {
            const chat = await Chat.findById(req.params.chatId).populate('messages');
            if (!chat) {
                throw new Error('Chat not found');
            }
            if (!chat.authors.includes(req.user._id)) {
                throw new Error('Unfortunately, you have no access to do that.');
            }
            const sender = await User.findById(req.user._id);
            const receiver = await User.findById(chat.authors[chat.authors.findIndex(author => {
                return !author.equals(sender._id);
            })]);
            res.json({ sender, receiver, chat });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }));
} else {
    router.get('/chat/:chatId', isLoggedIn, (req, res) => {
        res.sendFile(path.join(__dirname, "client-react-chatpage/public/index.html"));
    });
    router.get('/api/chat/:chatId', catchAsync(async (req, res, next) => {
        try {
            const chat = await Chat.findById(req.params.chatId).populate('messages');
            if (!chat) {
                throw new Error('Chat not found');
            }
            if (!chat.authors.includes(req.user._id)) {
                throw new Error('Unfortunately, you have no access to do that.');
            }
            const sender = await User.findById(req.user._id);
            const receiver = await User.findById(chat.authors[chat.authors.findIndex(author => {
                return !author.equals(sender._id);
            })]);
            res.json({ sender, receiver, chat });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }));
}



// if chat doesnt exist, then user would have to hit this route, instead of /chat/:chatId route 
// this route is from client side : user profile page (chat with ... button))
// then, after post the first message, the route to use is /chat/:chatId
router.get('/chat/:senderId/:receiverId', isLoggedIn, catchAsync(async (req, res, next) => {
    var chat = await Chat.findOne({ authors: { $all: [req.params.senderId, req.params.receiverId] } }).populate('messages');
    if (chat) {
        return res.redirect(`/chat/${chat._id}`)
    };
    const sender = await User.findById(req.params.senderId);
    const receiver = await User.findById(req.params.receiverId);
    if (sender._id.equals(receiver._id)) {
        req.flash('error', 'Unfortunately, you cannot have a chat with yourself.');
        return res.redirect(`/${sender._id}`)
    };
    res.render('users/chat', { sender, receiver, chat });
}))
// different post form if the chat does not exist (logic done in client side chat page)
router.post('/chat/new/:senderId/:receiverId', isLoggedIn, reqBodySanitize, validateMessage, catchAsync(async (req, res, next) => {
    const sender = await User.findById(req.params.senderId);
    const receiver = await User.findById(req.params.receiverId);

    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");

    const chat = new Chat();
    chat.dateCreated = `${currentTime} - ${currentDate}`;
    chat.authors.push(req.user._id, req.params.receiverId);

    const message = new Message(req.body)
    message.author = req.user._id;
    message.acceptor = receiver._id;
    message.dateCreated = `${currentTime} - ${currentDate}`;
    await message.save();


    chat.messages.push(message._id);
    chat.dateUpdated = `${currentTime} - ${currentDate}`;
    await chat.save()

    res.redirect(`/chat/${chat._id}`);
}));

router.get('/:id/chats', isLoggedIn, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id)
    const chats = await Chat.find({ authors: { $all: [user._id] } }).populate('authors').populate('messages');

    res.render('users/inbox', { user, chats });
}))




module.exports = router;