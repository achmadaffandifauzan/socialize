const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatSchema = new Schema({
    messages: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        }
    ],
    authors: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    dateCreated: {
        type: String,
    },
    dateUpdated: {
        type: String,
    }

})

module.exports = mongoose.model('Chat', chatSchema);