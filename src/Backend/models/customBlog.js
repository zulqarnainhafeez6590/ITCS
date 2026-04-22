import mongoose from "mongoose";

const widgetSchema = new mongoose.Schema({
  id: String,
  type: String,
  settings: mongoose.Schema.Types.Mixed,
}, { _id: false });

const columnSchema = new mongoose.Schema({
  id: String,
  widgets: [widgetSchema],
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  id: String,
  layout: String,
  backgroundColor: String,
  backgroundImage: String,
  padding: Number,
  columns: [columnSchema],
}, { _id: false });

const customBlogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true },
  excerpt: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  coverImageCaption: { type: String, default: "" },
  author: { type: String, default: "ITCS" },
  tags: { type: [String], default: [] },
  sections: { type: [sectionSchema], default: [] },
  
  layout: { 
    type: String, 
    enum: ["classic", "modern", "minimal"], 
    default: "modern" 
  },
  
  status: { 
    type: String, 
    enum: ["draft", "pending", "published", "archived"], 
    default: "draft" 
  },
  
  publishedAt: { type: Date, default: null },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

customBlogSchema.virtual("readingTime").get(function() {
  if (!this.sections || this.sections.length === 0) return 1;
  let wordCount = 0;
  this.sections.forEach(section => {
    if (section.columns) {
      section.columns.forEach(col => {
        if (col.widgets) {
          col.widgets.forEach(widget => {
            if (widget.settings?.content) {
              wordCount += widget.settings.content.split(/\s+/).length;
            }
          });
        }
      });
    }
  });
  return Math.max(1, Math.ceil(wordCount / 200));
});

customBlogSchema.pre("save", function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

export default mongoose.model("CustomBlog", customBlogSchema);