const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    text: {
        type: String,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    dateCreated: {
        type: String,
    }
});

module.exports = mongoose.model('Comment', commentSchema);