import mongoose from "mongoose";

const blogStatusSchema = new mongoose.Schema(
    {
    devId: { type: Number, required: true, unique: true },
    status: { type: String, enum: ["approved", "rejected", "pending"], default: "pending" },
    customAuthor: { type: String, default: "" },
    customDate: { type: String, default: "" } 
  },
  { timestamps: true }
);

export default mongoose.model("BlogStatus", blogStatusSchema);
