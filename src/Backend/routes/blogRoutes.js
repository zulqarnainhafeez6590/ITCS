import express from "express";
import BlogStatus from "../models/blog.js";

const router = express.Router();

// Get all blog statuses
router.get("/statuses", async (req, res) => {
  try {
    const statuses = await BlogStatus.find({});
    res.json(statuses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch statuses" });
  }
});

// Update status, author, or custom date
router.patch("/:devId/status", async (req, res) => {
  try {
    const devIdStr = req.params.devId;
    const devIdNum = parseInt(devIdStr, 10);
    console.log("Received request to update devId:", devIdStr, "parsed:", devIdNum, "body:", req.body);
    
    const { status, customAuthor, customDate } = req.body;

    if (!devIdNum || isNaN(devIdNum)) {
      return res.status(400).json({ error: "Invalid devId" });
    }

    const updateFields = {};
    if (status !== undefined) {
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      updateFields.status = status;
    }
    if (customAuthor !== undefined) updateFields.customAuthor = customAuthor;
    if (customDate !== undefined) updateFields.customDate = customDate;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // First try to find existing record
    let updated = await BlogStatus.findOne({ devId: devIdNum });
    
    if (updated) {
      // Update existing record
      Object.assign(updated, updateFields);
      await updated.save();
    } else {
      // Create new record with upsert
      updated = await BlogStatus.findOneAndUpdate(
        { devId: devIdNum },
        { $set: updateFields },
        { upsert: true, new: true }
      );
    }

    console.log("Updated document:", updated);
    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update record: " + err.message });
  }
});

// Get approved blog IDs
router.get("/approved-ids", async (req, res) => {
  try {
    const approvedBlogs = await BlogStatus.find({ status: "approved" }).select(
      "devId customAuthor customDate"
    );
    res.json(approvedBlogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch approved IDs" });
  }
});

export default router;
