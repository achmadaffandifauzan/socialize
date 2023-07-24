const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { Schema } = mongoose;
const imageSchema = new Schema({
    url: String,
    filename: String,
    thumb: String,
});
// Notes : (Cannot get .thumbnail in react issue) When you send a document to the client, functions do not go with it. There is no way to have Mongoose virtual methods/properties make it to the client side. (https://github.com/CatDadCode/mongoose-simpledb/issues/4)
imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});
imageSchema.virtual('thumbnail100').get(function () {
    return this.url.replace('/upload', '/upload/w_100');
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
