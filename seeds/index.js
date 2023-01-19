const mongoose = require('mongoose');
const Post = require('../models/post');
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
        const posts = new Post({
            title: `${post.title}`,
            description: `${post.description}`,
            hashtag: `${post.hashtag}`,
            image: 'https://images.unsplash.com/photo-1557218825-334e575bcc38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=50'
        })
        await posts.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})