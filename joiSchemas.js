const Joi = require('joi');
// this joiSchema only catch error if user pass the client side validation anyway (the bootstrap form validation)

// Joi.string().required() vs Joi.string() 
// Joi.string().required() means the object {key:value} should have the key and value
// Joi.string() means object {key:value} are ok to be empty, but if key are exists, value SHOULD exist too
// Joi.string().allow() means object {key:value} value can be empty

module.exports.postSchema = Joi.object({
    post: Joi.object({
        title: Joi.string().allow(null, ''),
        description: Joi.string().required(),
        hashtag: Joi.string().allow(null, ''),
        image: Joi.string().allow(null, ''),
    }).required(),
    deleteImages: Joi.array()
});

module.exports.commentSchema = Joi.object({
    comment: Joi.object({
        text: Joi.string().required()
    }).required()
})
module.exports.userSchema = Joi.object({
    user: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
        newpassword: Joi.string().allow(null, ''),
        profilePicture: Joi.string(),
        backgroundPicture: Joi.string(),
    }).required(),
    deleteProfilePictureFilename: Joi.string(),
    deleteBackgroundPictureFilename: Joi.string()
});

module.exports.messageSchema = Joi.object({
    message: Joi.string().required()
})