const mongoose = require('mongoose');
const Post = require('../models/post');
const User = require('../models/user');
const postSeed = require("./postSeed");

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/sosmed');

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => {
    console.log("Database Connected");
})

const seedDB = async () => {
    await Post.deleteMany();
    for (let post of postSeed) {
        const newPosts = new Post({
            title: `${post.title}`,
            description: `${post.description}`,
            hashtag: `${post.hashtag}`,
            author: '63cd24554d29f906fe639984',
            images: [{
                url: 'https://res.cloudinary.com/dgny2tywl/image/upload/v1674381268/Socialize/rfqabtkheyasu9zly4qu.jpg',
                filename: 'Socialize/rfqabtkheyasu9zly4qu',
            },
            {
                url: 'https://res.cloudinary.com/dgny2tywl/image/upload/v1674381262/Socialize/m8emlxhfgxofbd2mshad.jpg',
                filename: 'Socialize/m8emlxhfgxofbd2mshad',
            }]
        })
        await newPosts.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})