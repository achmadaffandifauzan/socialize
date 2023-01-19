const mongoose = require('mongoose');
const Comment = require('./comment')
const { Schema } = mongoose;

const PostSchema = new Schema({
    title: String,
    description: String,
    hashtag: String,
    image: String,
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
});

PostSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Comment.deleteMany({
            _id: {
                $in: doc.comments
            }
        })
    }
})

module.exports = mongoose.model('Post', PostSchema);