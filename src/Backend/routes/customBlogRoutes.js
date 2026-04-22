import express from "express";
import CustomBlog from "../models/customBlog.js";
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : { status: { $in: ["published", "draft"] } };
    
    const blogs = await CustomBlog.find(filter)
      .sort({ createdAt: -1 })
      .select("-sections");
    res.json(blogs);
  } catch (err) {
    console.error("Get blogs error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await CustomBlog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (err) {
    console.error("Get blog error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, slug, excerpt, coverImage, coverImageCaption, author, tags, sections, status } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const blog = new CustomBlog({
      title,
      slug,
      excerpt,
      coverImage,
      coverImageCaption,
      author: author || "ITCS",
      tags: tags || [],
      sections: sections || [],
      status: status || "draft",
    });
    
    await blog.save();
    console.log("Blog created:", blog._id);
    res.status(201).json(blog);
  } catch (err) {
    console.error("Create blog error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const blog = await CustomBlog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    
    const { title, slug, excerpt, coverImage, coverImageCaption, author, tags, sections, status } = req.body;
    
    if (title) blog.title = title;
    if (slug) blog.slug = slug;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (coverImageCaption !== undefined) blog.coverImageCaption = coverImageCaption;
    if (author) blog.author = author;
    if (tags) blog.tags = tags;
    if (sections) blog.sections = sections;
    if (status) blog.status = status;
    
    await blog.save();
    console.log("Blog updated:", blog._id);
    res.json(blog);
  } catch (err) {
    console.error("Update blog error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const blog = await CustomBlog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete blog error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/upload", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image data" });

    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: "Invalid image format" });

    const ext = matches[1];
    const data = matches[2];
    const filename = `img-${Date.now()}.${ext}`;
    
    // Use absolute path for reliability
    const uploadsDir = path.resolve(process.cwd(), 'uploads'); 
    
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));

    res.json({ success: true, url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;