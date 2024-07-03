const express = require('express');
const path = require('path');
const fileupload = require('express-fileupload');
const fs = require('fs');
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/bloggingSite', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
});

const Blog = mongoose.model('Blog', new mongoose.Schema({
    title: String,
    article: String,
    bannerImage: String,
    publishedAt: String
}));

let initial_path = path.join(__dirname, "public");

const app = express();
app.use(express.static(initial_path));
app.use(fileupload());
app.use(express.json()); // To parse JSON bodies

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(initial_path, "home.html"));
});

// Editor route
app.get('/editor', (req, res) => {
    res.sendFile(path.join(initial_path, "editor.html"));
});

// Upload route
app.post('/upload', (req, res) => {
    let file = req.files.image;
    let date = new Date();
    let imageName = date.getDate() + date.getTime() + file.name;
    let uploadPath = path.join(__dirname, 'public/uploads/', imageName);

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Move the file to the uploads directory
    file.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(`uploads/${imageName}`);
    });
});

// Publish blog route
app.post('/publish', (req, res) => {
    const blogData = req.body;
    const date = new Date();

    const blog = new Blog({
        title: blogData.title,
        article: blogData.article,
        bannerImage: blogData.bannerImage,
        publishedAt: `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    });

    blog.save()
        .then(() => {
            res.json({ message: 'Blog published successfully', blogId: blog._id });
        })
        .catch(err => res.status(500).json({ error: err.message }));
});

// Fetch all blogs
app.get('/blogs', (req, res) => {
    Blog.find({})
        .then(blogs => res.json(blogs))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Fetch a single blog by ID
app.get('/blog/:id', (req, res) => {
    Blog.findById(req.params.id)
        .then(blog => res.json(blog))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Edit blog route
app.post('/edit/:id', (req, res) => {
    const blogData = req.body;
    const blogId = req.params.id;

    Blog.findByIdAndUpdate(blogId, blogData, { new: true })
        .then(() => {
            res.json({ message: 'Blog updated successfully' });
        })
        .catch(err => res.status(500).json({ error: err.message }));
});

// Delete blog route
app.delete('/delete/:id', (req, res) => {
    const blogId = req.params.id;

    Blog.findByIdAndDelete(blogId)
        .then(() => {
            res.json({ message: 'Blog deleted successfully' });
        })
        .catch(err => res.status(500).json({ error: err.message }));
});

// Serve blog page
app.get("/:blog", (req, res) => {
    res.sendFile(path.join(initial_path, "blog.html"));
});

// Handle 404
app.use((req, res) => {
    res.status(404).json("404 - Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
