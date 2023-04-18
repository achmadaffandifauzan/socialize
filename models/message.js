const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    message: {
        type: String,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    acceptor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    dateCreated: {
        type: String,
    }

})

module.exports = mongoose.model('Message', messageSchema);