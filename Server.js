const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:3000' // Replace with your React app's URL
}));

mongoose.connect("mongodb+srv://pranav1984:pranav1984@cluster0.efgplkc.mongodb.net/Users?retryWrites=true&w=majority").then(() => {
    console.log("Connected to Db");
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    favoritePosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

const User = new mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    imageUrl:String,
    author: String,
    authorId:String,
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model("Post", postSchema);

//routes routes
app.post("/Login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (user) {
            if (password === user.password) {
                res.send({ message: "login success", username:user.username,user_id:user._id });
            } else {
                res.send({ message: "wrong credentials" });
            }
        } else {
            res.send("not registered");
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post("/Register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            res.send({ message: "user already exists" });
        } else {
            const newUser = new User({ username, email, password });
            await newUser.save();
            res.send({ message: "successful" });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post("/create-post", async (req, res) => {
    const { title, content,imageUrl, author,authorId } = req.body;
    try {
        const post = new Post({ title, content,imageUrl, author,authorId});
        await post.save();
        res.send({ message: "Blog post created successfully" });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get all blog posts route
app.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username');
        res.send(posts);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/posts/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const posts = await Post.find({ authorId: userId }); // Query by userId instead of _id
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get all blog posts route
app.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username');
        res.send(posts);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.delete("/posts/:postId", async (req, res) => {
    const postId = req.params.postId;
    try {
        await Post.findByIdAndDelete(postId);
        res.send({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

// Update an existing post
app.put("/posts/:postId", async (req, res) => {
    const postId = req.params.postId;
    const { title, content } = req.body;
  
    try {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, content },
        { new: true } // Return the updated post
      );
  
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      res.json({ message: "Post updated successfully", post: updatedPost });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/users/:userId/favorites/:postId", async (req, res) => {
    const userId = req.params.userId;
    const postId = req.params.postId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check if the post already exists in favorites
        if (user.favoritePosts.includes(postId)) {
            return res.status(400).json({ message: "Post already in favorites" });
        }
        // Add the post to favorites
        user.favoritePosts.push(postId);
        await user.save();
        res.json({ message: "Post added to favorites successfully" });
    } catch (error) {
        console.error("Error adding post to favorites:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Remove a post from favorites
app.delete("/users/:userId/favorites/:postId", async (req, res) => {
    const userId = req.params.userId;
    const postId = req.params.postId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check if the post exists in favorites
        if (!user.favoritePosts.includes(postId)) {
            return res.status(400).json({ message: "Post not found in favorites" });
        }
        // Remove the post from favorites
        user.favoritePosts = user.favoritePosts.filter(post => post.toString() !== postId);
        await user.save();
        res.json({ message: "Post removed from favorites successfully" });
    } catch (error) {
        console.error("Error removing post from favorites:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// Get favorites for a specific user
app.get("/users/:userId/favorites", async (req, res) => {
    const userId = req.params.userId;
    try {
      const user = await User.findById(userId).populate('favoritePosts');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user.favoritePosts);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  
app.listen(7979, () => {
    console.log("Server is Started on 7979");
});
