const mongoose = require('mongoose');
const Comment = require('./comment')
const { Schema } = mongoose;

const imageSchema = new Schema({
    url: String,
    filename: String
});
imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const postSchema = new Schema({
    title: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: true,
    },
    hashtag: {
        type: String,
        required: false,
    },
    images: [imageSchema],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
});

postSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Comment.deleteMany({
            _id: {
                $in: doc.comments
            }
        })
    }
})

module.exports = mongoose.model('Post', postSchema);