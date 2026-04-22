import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./PostBlog.scss";

const WIDGETS = [
  { id: "heading", name: "Heading", icon: "H", category: "text" },
  { id: "text", name: "Text", icon: "T", category: "text" },
  { id: "image", name: "Image", icon: "🖼", category: "media" },
  { id: "video", name: "Video", icon: "▶", category: "media" },
  { id: "quote", name: "Quote", icon: '"', category: "text" },
  { id: "button", name: "Button", icon: "▢", category: "button" },
  { id: "divider", name: "Divider", icon: "—", category: "layout" },
  { id: "spacer", name: "Spacer", icon: "↕", category: "layout" },
  { id: "columns", name: "Columns", icon: "⊞", category: "layout" },
  { id: "icon", name: "Icon", icon: "★", category: "media" },
  { id: "social", name: "Social", icon: "🔗", category: "media" },
  { id: "search", name: "Search", icon: "🔍", category: "layout" },
];

const COLUMNS_LAYOUTS = [
  { id: "1", name: "1 Column", cols: [1] },
  { id: "1-1", name: "2 Columns (50/50)", cols: [1, 1] },
  { id: "1-2", name: "2 Columns (33/66)", cols: [1, 2] },
  { id: "2-1", name: "2 Columns (66/33)", cols: [2, 1] },
  { id: "1-1-1", name: "3 Columns", cols: [1, 1, 1] },
  { id: "1-2-1", name: "4 Columns", cols: [1, 2, 1] },
];

const PostBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const dragItemRef = useRef(null);
  const dragOverItemRef = useRef(null);

  const [blog, setBlog] = useState({
    title: "",
    slug: "",
    excerpt: "",
    coverImage: "",
    coverImageCaption: "",
    author: "ITCS",
    tags: [],
    sections: [],
    status: "draft",
  });

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addSection = (layout = "1") => {
    const newSection = {
      id: `section-${Date.now()}`,
      layout,
      backgroundColor: "",
      backgroundImage: "",
      padding: 40,
      columns: [{ id: `col-${Date.now()}`, widgets: [] }],
    };
    
    if (layout.includes("-")) {
      const cols = layout.split("-").length;
      newSection.columns = [];
      for (let i = 0; i < cols; i++) {
        newSection.columns.push({
          id: `col-${Date.now()}-${i}`,
          widgets: [],
        });
      }
    }
    
    setBlog(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const updateSection = (sectionIndex, field, value) => {
    setBlog(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex][field] = value;
      return { ...prev, sections: newSections };
    });
  };

  const removeSection = (sectionIndex) => {
    setBlog(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sectionIndex),
    }));
  };

  const addWidgetToColumn = (sectionIndex, columnIndex, widgetType) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      settings: getDefaultSettings(widgetType),
    };
    
    setBlog(prev => {
      const newSections = prev.sections.map((section, si) => {
        if (si !== sectionIndex) return section;
        return {
          ...section,
          columns: section.columns.map((col, ci) => {
            if (ci !== columnIndex) return col;
            return {
              ...col,
              widgets: [...col.widgets, newWidget]
            };
          })
        };
      });
      return { ...prev, sections: newSections };
    });
  };

  const updateWidgetSettings = (sectionIndex, columnIndex, widgetIndex, settingKey, value) => {
    setBlog(prev => {
      const newSections = prev.sections.map((section, si) => {
        if (si !== sectionIndex) return section;
        return {
          ...section,
          columns: section.columns.map((col, ci) => {
            if (ci !== columnIndex) return col;
            return {
              ...col,
              widgets: col.widgets.map((w, wi) => {
                if (wi !== widgetIndex) return w;
                return {
                  ...w,
                  settings: { ...w.settings, [settingKey]: value }
                };
              })
            };
          })
        };
      });
      return { ...prev, sections: newSections };
    });
  };

  const removeWidget = (sectionIndex, columnIndex, widgetIndex) => {
    setBlog(prev => {
      const newSections = prev.sections.map((section, si) => {
        if (si !== sectionIndex) return section;
        return {
          ...section,
          columns: section.columns.map((col, ci) => {
            if (ci !== columnIndex) return col;
            return {
              ...col,
              widgets: col.widgets.filter((_, wi) => wi !== widgetIndex)
            };
          })
        };
      });
      return { ...prev, sections: newSections };
    });
  };

  const moveWidget = (sectionIndex, columnIndex, widgetIndex, direction) => {
    setBlog(prev => {
      const newSections = prev.sections.map((section, si) => {
        if (si !== sectionIndex) return section;
        return {
          ...section,
          columns: section.columns.map((col, ci) => {
            if (ci !== columnIndex) return col;
            const widgets = [...col.widgets];
            const newIndex = widgetIndex + direction;
            if (newIndex < 0 || newIndex >= widgets.length) {
              return col;
            }
            const temp = widgets[widgetIndex];
            widgets[widgetIndex] = widgets[newIndex];
            widgets[newIndex] = temp;
            return { ...col, widgets };
          })
        };
      });
      return { ...prev, sections: newSections };
    });
  };

  const duplicateWidget = (sectionIndex, columnIndex, widgetIndex) => {
    setBlog(prev => {
      const widget = prev.sections[sectionIndex].columns[columnIndex].widgets[widgetIndex];
      const newWidget = {
        ...widget,
        id: `widget-${Date.now()}`,
        settings: { ...widget.settings },
      };
      const newSections = prev.sections.map((section, si) => {
        if (si !== sectionIndex) return section;
        return {
          ...section,
          columns: section.columns.map((col, ci) => {
            if (ci !== columnIndex) return col;
            const widgets = [...col.widgets];
            widgets.splice(widgetIndex + 1, 0, newWidget);
            return { ...col, widgets };
          })
        };
      });
      return { ...prev, sections: newSections };
    });
  };

  const handleDragStart = (e, widgetType) => {
    setDraggedWidget(widgetType);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e, sectionIndex, columnIndex) => {
    e.preventDefault();
    if (draggedWidget) {
      addWidgetToColumn(sectionIndex, columnIndex, draggedWidget);
      setDraggedWidget(null);
    }
  };

  const handleWidgetClick = (sectionIndex, columnIndex, widgetIndex) => {
    const widget = blog.sections[sectionIndex].columns[columnIndex].widgets[widgetIndex];
    setSelectedWidget({ sectionIndex, columnIndex, widgetIndex, widget });
  };

  const handleSave = async (publish = false, e) => {
    if (e) e.preventDefault();
    
    const blogData = { ...blog, tags };
    
    if (publish) {
      blogData.status = "pending";
    }

    setSaving(true);
    setMessage("");

    try {
      if (id) {
        await axios.put(`http://localhost:5000/api/custom-blogs/${id}`, blogData);
        setMessage("Blog updated successfully!");
      } else {
        const res = await axios.post("http://localhost:5000/api/custom-blogs", blogData);
        setMessage("Blog created successfully!");
        navigate(`/admin/post-blog/${res.data._id}`, { replace: true });
      }
    } catch (err) {
      console.error("Full Save Error Object:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Error saving blog";
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="post-blog-container">
      <div className="editor-header">
        <h2>{id ? "Edit Blog" : "Create Blog"}</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={(e) => handleSave(false, e)} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button className="btn-primary" onClick={(e) => handleSave(true, e)} disabled={saving}>
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.toLowerCase().includes("error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      <div className="editor-layout">
        <div className="editor-widgets-panel">
          <div className="panel-header">
            <h3>Widgets</h3>
            <p>Drag widgets to the page</p>
          </div>
          
          <div className="widgets-list">
            {WIDGETS.map(widget => (
              <div
                key={widget.id}
                className="widget-item"
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragEnd={() => setDraggedWidget(null)}
              >
                <span className="widget-icon">{widget.icon}</span>
                <span className="widget-name">{widget.name}</span>
              </div>
            ))}
          </div>

          <div className="sections-list">
            <h4>Page Sections</h4>
            <button className="section-btn" onClick={() => addSection("1")}>
              + Single Column
            </button>
            <button className="section-btn" onClick={() => addSection("1-1")}>
              + 2 Columns
            </button>
            <button className="section-btn" onClick={() => addSection("1-1-1")}>
              + 3 Columns
            </button>
          </div>

          <div className="blog-settings">
            <h4>Blog Settings</h4>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={blog.title}
                onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                placeholder="Blog title"
              />
            </div>
            <div className="form-group">
              <label>Cover Image</label>
              <div className="image-upload-wrapper">
                <input
                  type="text"
                  value={blog.coverImage}
                  onChange={(e) => setBlog({ ...blog, coverImage: e.target.value })}
                  placeholder="Image URL..."
                />
                <label className="file-upload-btn">
                  {uploadingCover ? '...' : '📁'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploadingCover(true);
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const base64 = reader.result;
                          const res = await axios.post('http://localhost:5000/api/custom-blogs/upload', { image: base64 });
                          if (res.data.success) {
                            setBlog({ ...blog, coverImage: res.data.url });
                          }
                        } catch (err) {
                          alert("Cover image upload failed");
                        } finally {
                          setUploadingCover(false);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    hidden
                  />
                </label>
              </div>
              {blog.coverImage && <img src={blog.coverImage} alt="Cover Preview" className="image-preview-mini" />}
            </div>
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={blog.author}
                onChange={(e) => setBlog({ ...blog, author: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Excerpt</label>
              <textarea
                value={blog.excerpt}
                onChange={(e) => setBlog({ ...blog, excerpt: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input">
                <input 
                  type="text" 
                  value={tagInput} 
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <button onClick={addTag}>+</button>
              </div>
              <div className="tags-list">
                {tags.map(tag => (
                  <span key={tag} className="tag">#{tag} <button onClick={() => removeTag(tag)}>×</button></span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="editor-preview-area">
          <div className="preview-header">
            <span className="device-toggle">
              <button className="active" title="Desktop">🖥</button>
              <button title="Tablet">📱</button>
              <button title="Mobile">📲</button>
            </span>
          </div>

          <div className="preview-canvas">
            {blog.sections.length === 0 ? (
              <div className="empty-state">
                <h3>Start Building</h3>
                <p>Drag widgets or add sections from the left panel</p>
                <div className="quick-add">
                  <button onClick={() => addSection("1")}>+ Add Section</button>
                </div>
              </div>
            ) : (
              blog.sections.map((section, sectionIndex) => (
                <div key={section.id} className="preview-section">
                  <div className="section-toolbar">
                    <select 
                      value={section.layout}
                      onChange={(e) => updateSection(sectionIndex, "layout", e.target.value)}
                    >
                      {COLUMNS_LAYOUTS.map(layout => (
                        <option key={layout.id} value={layout.id}>{layout.name}</option>
                      ))}
                    </select>
                    <input 
                      type="color" 
                      value={section.backgroundColor}
                      onChange={(e) => updateSection(sectionIndex, "backgroundColor", e.target.value)}
                      title="Background Color"
                    />
                    <input 
                      type="number" 
                      value={section.padding}
                      onChange={(e) => updateSection(sectionIndex, "padding", parseInt(e.target.value))}
                      title="Padding"
                    />
                    <button className="delete-btn" onClick={() => removeSection(sectionIndex)}>×</button>
                  </div>

                  <div 
                    className="section-content"
                    style={{ 
                      backgroundColor: section.backgroundColor,
                      padding: `${section.padding}px`,
                    }}
                  >
                    <div className={`columns-layout cols-${section.layout}`}>
                      {section.columns.map((column, columnIndex) => (
                        <div 
                          key={column.id} 
                          className="column"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, sectionIndex, columnIndex)}
                        >
                          {column.widgets.length === 0 ? (
                            <div className="column-empty">
                              <span>Drop widgets here</span>
                            </div>
                          ) : (
                            column.widgets.map((widget, widgetIndex) => (
                              <div 
                                key={widget.id} 
                                className={`widget-preview ${selectedWidget?.sectionIndex === sectionIndex && selectedWidget?.columnIndex === columnIndex && selectedWidget?.widgetIndex === widgetIndex ? "selected" : ""}`}
                                onClick={() => handleWidgetClick(sectionIndex, columnIndex, widgetIndex)}
                              >
                                <div className="widget-toolbar">
                                  <button onClick={(e) => { e.stopPropagation(); moveWidget(sectionIndex, columnIndex, widgetIndex, -1); }}>↑</button>
                                  <button onClick={(e) => { e.stopPropagation(); moveWidget(sectionIndex, columnIndex, widgetIndex, 1); }}>↓</button>
                                  <button onClick={(e) => { e.stopPropagation(); duplicateWidget(sectionIndex, columnIndex, widgetIndex); }}>⧉</button>
                                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); removeWidget(sectionIndex, columnIndex, widgetIndex); }}>×</button>
                                </div>
                                <WidgetRenderer widget={widget} />
                              </div>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="editor-settings-panel">
          {selectedWidget ? (
            <WidgetSettingsPanel 
              widget={selectedWidget}
              currentWidget={blog.sections[selectedWidget.sectionIndex]?.columns[selectedWidget.columnIndex]?.widgets[selectedWidget.widgetIndex]}
              onUpdate={updateWidgetSettings}
              onClose={() => setSelectedWidget(null)}
            />
          ) : (
            <div className="panel-placeholder">
              <p>Select a widget to edit its settings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getDefaultSettings(widgetType) {
  const defaults = {
    heading: { text: "Your Heading Here", level: "h2", align: "left", color: "#ffffff", bgColor: "transparent", fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0 },
    text: { content: "Write your paragraph content here.", align: "left", color: "#ffffff", fontSize: 16, fontWeight: 400, lineHeight: 1.7, letterSpacing: 0 },
    image: { url: "", alt: "Image description", size: "full", align: "center" },
    video: { url: "", autoplay: false },
    quote: { text: "This is an inspiring quote that you want to highlight.", author: "Author Name", align: "center" },
    button: { text: "Click Here", url: "#", style: "filled", bgColor: "#4a9eff", textColor: "#ffffff" },
    divider: { style: "solid", width: 100, color: "#333333" },
    spacer: { height: 40 },
    icon: { icon: "star", size: 48, color: "#4a9eff" },
    social: { platforms: ["twitter", "facebook", "linkedin"], color: "#4a9eff" },
    search: { placeholder: "Search...", bgColor: "#1a1a1a", textColor: "#ffffff" },
    columns: { columns: 2, gap: 16, bgColor: "#000000" },
  };
  return defaults[widgetType] || {};
}

function WidgetRenderer({ widget }) {
  const { type, settings } = widget;
  
  const textColor = settings.color || "#ffffff";
  const align = settings.align || "left";
  
  switch (type) {
    case "heading": {
      const HeadingTag = settings.level || "h2";
      const headingBg = settings.bgColor || "transparent";
      return (
        <div className="widget-heading" style={{ 
          textAlign: align, 
          background: headingBg, 
          padding: headingBg !== "transparent" ? "10px 15px" : 0, 
          borderRadius: headingBg !== "transparent" ? 8 : 0 
        }}>
          <HeadingTag style={{ 
            color: textColor, 
            margin: 0,
            fontSize: settings.fontSize ? `${settings.fontSize}px` : undefined,
            fontWeight: settings.fontWeight,
            lineHeight: settings.lineHeight,
            letterSpacing: settings.letterSpacing ? `${settings.letterSpacing}px` : undefined
          }}>{settings.text || "Heading"}</HeadingTag>
        </div>
      );
    }
    
    case "text":
      return (
        <div className="widget-text" style={{ textAlign: align }}>
          <p style={{ 
            color: textColor, 
            margin: 0, 
            lineHeight: settings.lineHeight || 1.7,
            fontSize: settings.fontSize ? `${settings.fontSize}px` : undefined,
            fontWeight: settings.fontWeight,
            letterSpacing: settings.letterSpacing ? `${settings.letterSpacing}px` : undefined
          }}>{settings.content || "Enter your text here..."}</p>
        </div>
      );
    
    case "image":
      const imgWidth = settings.size === "full" ? "100%" : settings.size === "half" ? "50%" : "25%";
      return (
        <div className="widget-image" style={{ textAlign: align }}>
          {settings.url ? (
            <img src={settings.url} alt={settings.alt || ""} style={{ width: imgWidth, borderRadius: 8 }} />
          ) : (
            <div className="image-placeholder" style={{ padding: "30px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "2px dashed rgba(255,255,255,0.2)" }}>
              <span style={{ fontSize: 24 }}>🖼</span>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Click to add image URL</p>
            </div>
          )}
        </div>
      );
    
    case "video":
      let videoEmbedUrl = "";
      if (settings.url) {
        if (settings.url.includes("youtube.com") || settings.url.includes("youtu.be")) {
          let videoId = "";
          if (settings.url.includes("youtu.be")) {
            videoId = settings.url.split("/").pop();
          } else if (settings.url.includes("watch")) {
            videoId = new URL(settings.url).searchParams.get("v");
          } else {
            const match = settings.url.match(/v=([a-zA-Z0-9_-]+)/);
            if (match) videoId = match[1];
          }
          if (videoId) videoEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (settings.url.includes("vimeo.com")) {
          const videoId = settings.url.split("/").pop();
          videoEmbedUrl = `https://player.vimeo.com/video/${videoId}`;
        }
      }
      return (
        <div className="widget-video">
          {videoEmbedUrl ? (
            <iframe 
              src={videoEmbedUrl}
              title="Video" 
              frameBorder="0" 
              allowFullScreen
              style={{ width: "100%", height: 300, borderRadius: 8 }}
            />
          ) : (
            <div className="video-placeholder" style={{ padding: "30px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "2px dashed rgba(255,255,255,0.2)", textAlign: "center" }}>
              <span style={{ fontSize: 24 }}>▶</span>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Enter YouTube/Vimeo URL</p>
            </div>
          )}
        </div>
      );
    
    case "quote":
      return (
        <blockquote className="widget-quote" style={{ textAlign: align, padding: "20px", background: "rgba(74,158,255,0.1)", borderLeft: "4px solid #4a9eff", borderRadius: "0 8px 8px 0", margin: "16px 0" }}>
          <p style={{ color: textColor, margin: "0 0 8px", fontStyle: "italic", fontSize: 16 }}>{settings.text || "Quote text here..."}</p>
          {settings.author && <cite style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>— {settings.author}</cite>}
        </blockquote>
      );
    
    case "button":
      const btnStyle = settings.style === "filled" 
        ? { background: settings.bgColor || "#4a9eff", color: settings.textColor || "#ffffff", border: "none" }
        : settings.style === "outline"
        ? { background: "transparent", color: settings.bgColor || "#4a9eff", border: `2px solid ${settings.bgColor || "#4a9eff"}` }
        : { background: "transparent", color: settings.textColor || "#4a9eff", border: "none", textDecoration: "underline" };
      return (
        <div style={{ textAlign: align, margin: "16px 0" }}>
          <a href={settings.url || "#"} className="widget-button" style={{ ...btnStyle, padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
            {settings.text || "Click Here"}
          </a>
        </div>
      );
    
    case "divider":
      return (
        <div style={{ margin: "20px 0", textAlign: align }}>
          <hr style={{ border: "none", borderTop: `1px solid ${settings.color || "rgba(255,255,255,0.2)"}`, width: `${settings.width || 100}%` }} />
        </div>
      );
    
    case "spacer":
      return <div style={{ height: settings.height || 40, background: "repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,0.02) 5px,rgba(255,255,255,0.02) 10px)" }} />;
    
    case "columns": {
      const numCols = settings.columns || 2;
      const colGap = settings.gap || 16;
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numCols}, 1fr)`, gap: colGap, padding: "16px 0", background: settings.bgColor || "transparent" }}>
          {Array.from({ length: numCols }, (_, i) => (
            <div key={i} style={{ minHeight: 60, border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
              Column {i + 1}
            </div>
          ))}
        </div>
      );
    }
    
    case "icon": {
      const iconMap = { star: "★", heart: "♥", check: "✓", flag: "⚑", bell: "🔔", bookmark: "🔖", calendar: "📅", clock: "🕐" };
      const iconChar = iconMap[settings.icon] || "★";
      return (
        <div style={{ textAlign: align, margin: "16px 0" }}>
          <span style={{ fontSize: settings.size || 48, color: settings.color || "#4a9eff" }}>{iconChar}</span>
        </div>
      );
    }
    
    case "social":
      return (
        <div style={{ textAlign: align, display: "flex", gap: 12, justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start", margin: "16px 0" }}>
          {settings.platforms?.length > 0 ? settings.platforms.map(platform => (
            <span key={platform} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: settings.color || "#4a9eff", borderRadius: "50%", fontSize: 14, color: "#fff" }}>
              {platform[0].toUpperCase()}
            </span>
          )) : <span style={{color:"rgba(255,255,255,0.4)"}}>Select platforms</span>}
        </div>
      );
    
    case "search":
      return (
        <div style={{ textAlign: align, margin: "16px 0" }}>
          <input 
            type="text" 
            placeholder={settings.placeholder || "Search..."} 
            style={{ 
              width: "100%", 
              padding: "12px 16px", 
              background: settings.bgColor || "rgba(255,255,255,0.1)", 
              border: "1px solid rgba(255,255,255,0.2)", 
              borderRadius: 8, 
              color: settings.textColor || "#fff",
              fontSize: 14
            }} 
            disabled 
          />
        </div>
      );
    
    default:
      return <div style={{ padding: 20, background: "rgba(255,0,0,0.1)", borderRadius: 8, color: "#ff6b6b" }}>Unknown Widget: {type}</div>;
  }
}

function WidgetSettingsPanel({ widget, currentWidget, onUpdate, onClose }) {
  const { sectionIndex, columnIndex, widgetIndex } = widget;
  const w = currentWidget || widget.widget;
  const settings = w.settings || {};
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const res = await axios.post('http://localhost:5000/api/custom-blogs/upload', { image: base64 });
        if (res.data.success) {
          onUpdate(sectionIndex, columnIndex, widgetIndex, 'url', res.data.url);
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload image to server.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      alert('Video size must be less than 50MB');
      return;
    }
    
    setUploadingVideo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const res = await axios.post('http://localhost:5000/api/custom-blogs/upload', { image: base64 });
        if (res.data.success) {
          onUpdate(sectionIndex, columnIndex, widgetIndex, 'url', res.data.url);
        }
      } catch (err) {
        alert("Video upload failed");
      } finally {
        setUploadingVideo(false);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const isImageWidget = w.type === 'image';
  const isVideoWidget = w.type === 'video';
  const isButtonWidget = w.type === 'button';
  
  return (
    <div className="widget-settings">
      <div className="settings-header">
        <h3>{w.type} Settings</h3>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="settings-content">
        {Object.keys(settings).map(key => {
          if (key === 'url' && isImageWidget) {
            return (
              <div key={key} className="setting-field">
                <label>Image URL</label>
                <div className="image-upload-wrapper">
                  <input
                    type="text"
                    value={settings[key] || ''}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                    placeholder="Paste image URL or choose file..."
                  />
                  <label className="file-upload-btn" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: '#4a9eff', borderRadius: 6, color: 'white', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploading ? 'Wait...' : '📁 Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      hidden
                    />
                  </label>
                </div>
                <p style={{fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '8px 0 0'}}>
                  Tip: Use image from your computer or paste any image URL
                </p>
                {settings[key] && (
                  <img src={settings[key]} alt="Preview" className="image-preview" />
                )}
              </div>
            );
          }
          
          if (key === 'url' && isVideoWidget) {
            return (
              <div key={key} className="setting-field">
                <label>Video</label>
                <div className="image-upload-wrapper">
                  <input
                    type="text"
                    value={settings[key] || ''}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                    placeholder="YouTube URL or upload from computer"
                  />
                  <label className="file-upload-btn" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: '#4a9eff', borderRadius: 6, color: 'white', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploadingVideo ? 'Wait...' : '📁 Upload'}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      hidden
                    />
                  </label>
                </div>
                <p style={{fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '8px 0 0'}}>
                  Tip: Upload video from your computer (max 50MB) or paste YouTube URL
                </p>
                {settings[key] && (
                  <video src={settings[key]} controls style={{width: '100%', marginTop: 10}} />
                )}
              </div>
            );
          }
          
          if (key === 'url' && isButtonWidget) {
            return (
              <div key={key} className="setting-field">
                <label>Link URL</label>
                <input
                  type="text"
                  value={settings[key] || ''}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                  placeholder="https://..."
                />
              </div>
            );
          }
          
          if (key === 'content' || key === 'text') {
            return (
              <div key={key} className="setting-field">
                <label>{key}</label>
                <textarea
                  value={settings[key] || ''}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                  rows={4}
                />
              </div>
            );
          }
          
          if (key === 'color') {
            return (
              <div key={key} className="setting-field">
                <label>Text Color</label>
                <div className="color-field">
                  <input
                    type="color"
                    value={settings[key] || '#ffffff'}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings[key] || '#ffffff'}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                  />
                </div>
              </div>
            );
          }
          
          if (key === 'bgColor') {
            const bgValue = settings[key] || '';
            const colorValue = bgValue === 'transparent' ? '#000000' : (bgValue.startsWith('#') ? bgValue : '#000000');
            return (
              <div key={key} className="setting-field">
                <label>Background Color</label>
                <div className="color-field">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                  />
                  <input
                    type="text"
                    value={bgValue || ''}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                    placeholder="#000000 or transparent"
                  />
                </div>
                <label style={{marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={bgValue === 'transparent'}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.checked ? 'transparent' : '#000000')}
                  />
                  <span style={{fontSize: 12}}>Transparent</span>
                </label>
              </div>
            );
          }
          
          if (key === 'align' || key === 'size' || key === 'level' || key === 'style') {
            return (
              <div key={key} className="setting-field">
                <label>{key}</label>
                <select
                  value={settings[key] || ''}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                >
                  {key === 'level' && (
                    <>
                      <option value="h1">H1 - Main Heading</option>
                      <option value="h2">H2 - Section</option>
                      <option value="h3">H3 - Sub</option>
                      <option value="h4">H4 - Small</option>
                    </>
                  )}
                  {key === 'align' && (
                    <>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </>
                  )}
                  {key === 'size' && (
                    <>
                      <option value="full">Full</option>
                      <option value="half">Half</option>
                      <option value="quarter">Quarter</option>
                    </>
                  )}
                  {key === 'style' && isButtonWidget && (
                    <>
                      <option value="filled">Filled</option>
                      <option value="outline">Outline</option>
                      <option value="text">Text Only</option>
                    </>
                  )}
                </select>
              </div>
            );
          }
          
          if (key === 'height' || key === 'width' || key === 'size') {
            return (
              <div key={key} className="setting-field">
                <label>{key}</label>
                <input
                  type="number"
                  value={settings[key] || 0}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, parseInt(e.target.value))}
                />
              </div>
            );
          }
          
          if (key === 'alt' || key === 'author') {
            return (
              <div key={key} className="setting-field">
                <label>{key}</label>
                <input
                  type="text"
                  value={settings[key] || ''}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                />
              </div>
            );
          }
          
          if (key === 'icon' || key === 'icon') {
            return (
              <div key={key} className="setting-field">
                <label>Icon</label>
                <select
                  value={settings[key] || 'star'}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                >
                  <option value="star">★ Star</option>
                  <option value="heart">♥ Heart</option>
                  <option value="check">✓ Check</option>
                  <option value="flag">⚑ Flag</option>
                  <option value="bell">🔔 Bell</option>
                  <option value="bookmark">🔖 Bookmark</option>
                  <option value="calendar">📅 Calendar</option>
                  <option value="clock">🕐 Clock</option>
                </select>
              </div>
            );
          }
          
          if (key === 'platforms') {
            const availablePlatforms = ['twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'github'];
            return (
              <div key={key} className="setting-field">
                <label>Social Platforms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {availablePlatforms.map(platform => (
                    <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: settings.platforms?.includes(platform) ? 'rgba(74,158,255,0.3)' : 'rgba(255,255,255,0.05)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.platforms?.includes(platform) || false}
                        onChange={(e) => {
                          const current = settings.platforms || [];
                          const updated = e.target.checked
                            ? [...current, platform]
                            : current.filter(p => p !== platform);
                          onUpdate(sectionIndex, columnIndex, widgetIndex, key, updated);
                        }}
                        hidden
                      />
                      {platform}
                    </label>
                  ))}
                </div>
              </div>
            );
          }
          
          if (key === 'textColor') {
            return (
              <div key={key} className="setting-field">
                <label>Text Color</label>
                <div className="color-field">
                  <input
                    type="color"
                    value={settings[key] || '#ffffff'}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings[key] || '#ffffff'}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, e.target.value)}
                  />
                </div>
              </div>
            );
          }
          
          if (key === 'columns') {
            return (
              <div key={key} className="setting-field">
                <label>Number of Columns</label>
                <select
                  value={settings[key] || 2}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, parseInt(e.target.value))}
                >
                  <option value="2">2 Columns</option>
                  <option value="3">3 Columns</option>
                  <option value="4">4 Columns</option>
                </select>
              </div>
            );
          }
          
          if (key === 'gap') {
            return (
              <div key={key} className="setting-field">
                <label>Gap (px)</label>
                <input
                  type="number"
                  value={settings[key] || 16}
                  onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, parseInt(e.target.value))}
                />
              </div>
            );
          }
          
          if (key === 'fontSize' || key === 'fontWeight' || key === 'lineHeight' || key === 'letterSpacing') {
            const labelMap = { 
              fontSize: 'Font Size (px)', 
              fontWeight: 'Font Weight', 
              lineHeight: 'Line Height', 
              letterSpacing: 'Letter Spacing (px)' 
            };
            
            return (
              <div key={key} className="setting-field">
                <label>{labelMap[key]}</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="range"
                    min={key === 'fontWeight' ? 100 : 0}
                    max={key === 'fontSize' ? 120 : (key === 'fontWeight' ? 900 : (key === 'lineHeight' ? 3 : 20))}
                    step={key === 'lineHeight' ? 0.1 : (key === 'fontWeight' ? 100 : 1)}
                    value={settings[key] || 0}
                    onChange={(e) => onUpdate(sectionIndex, columnIndex, widgetIndex, key, parseFloat(e.target.value))}
                  />
                  <span style={{ fontSize: 11, minWidth: 25 }}>{settings[key]}</span>
                </div>
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
}

export default PostBlog;