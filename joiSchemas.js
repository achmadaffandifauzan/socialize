const Joi = require('joi');
// this joiSchema only catch error if user pass the client side validation anyway (the bootstrap form validation)

module.exports.postSchema = Joi.object({
    post: Joi.object({
        title: Joi.string().allow(""),
        description: Joi.string().required(),
        hashtag: Joi.string().allow(""),
        image: Joi.string().allow(""),
    }).required(),
    deleteImages: Joi.array()
});

module.exports.commentSchema = Joi.object({
    comment: Joi.object({
        text: Joi.string().required()
    }).required()
})
