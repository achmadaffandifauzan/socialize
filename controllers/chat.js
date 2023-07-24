const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const ExpressError = require('../utils/ExpressError');
const dayjs = require('dayjs');

module.exports.postMessage = async (message) => {
    const receiver = await User.findById(message.receiverId);
    if (!receiver) {
        return new ExpressError('User Not Found!', 404)
    }
    const currentTime = dayjs().format("HH:mm");
    const currentDate = dayjs().format("D MMM YY");
    const currentDateTime = `${currentTime} - ${currentDate}`;
    var chat = await Chat.findById(message.roomId);
    if (!chat) {
        var chat = new Chat();
        chat.dateCreated = currentDateTime;
        chat.authors.push(message.senderId, message.receiverId);
    }
    const newMessage = new Message({
        message: message.message,
        author: message.senderId,
        acceptor: message.receiverId,
        dateCreated: currentDateTime,
    })
    await newMessage.save();

    chat.messages.push(newMessage._id);
    chat.dateUpdated = currentDateTime;
    await chat.save()

    return newMessage;
}