const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { Schema } = mongoose;
const imageSchema = new Schema({
    url: String,
    filename: String
});
imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Post'
        }
    ],
    friends: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    friendRequests: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    profilePicture: imageSchema,
    backgroundPicture: imageSchema,
    dateCreated: {
        type: String,
    },
    lastOnline: {
        type: String,
    }
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);
