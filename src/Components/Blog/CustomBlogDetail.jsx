import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./BlogDetail.scss";

const WidgetRenderer = ({ widget }) => {
  const { type, settings } = widget;
  
  const textColor = settings?.color || "#ffffff";
  const align = settings?.align || "left";
  
  switch (type) {
    case "heading":
      const HeadingTag = settings?.level || "h2";
      return (
        <div style={{ textAlign: align }}>
          <HeadingTag style={{ color: textColor, margin: "24px 0 12px" }}>{settings?.text || "Heading"}</HeadingTag>
        </div>
      );
    
    case "text":
      return (
        <div 
          className="text-widget-content"
          style={{ textAlign: align, marginBottom: 16, color: textColor, lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: settings?.content || "" }}
        />
      );
    
    case "image":
      const imgWidth = settings?.size === "full" ? "100%" : settings?.size === "half" ? "50%" : "25%";
      if (!settings?.url) return null;
      return (
        <div style={{ textAlign: align, margin: "20px 0" }}>
          <img src={settings.url} alt={settings.alt || ""} style={{ width: imgWidth, borderRadius: 8, maxWidth: "100%" }} />
        </div>
      );
    
    case "video":
      if (!settings?.url) return null;
      const videoUrl = settings.url.includes("youtube") || settings.url.includes("youtu.be") 
        ? settings.url.replace("watch?v=", "embed/").replace("youtu.be/", "embed/")
        : settings.url;
      return (
        <div style={{ margin: "20px 0" }}>
          <iframe src={videoUrl} title="Video" frameBorder="0" allowFullScreen style={{ width: "100%", height: 350, borderRadius: 8 }} />
        </div>
      );
    
    case "quote":
      return (
        <blockquote style={{ textAlign: align, padding: "20px 24px", background: "rgba(74,158,255,0.1)", borderLeft: "4px solid #4a9eff", borderRadius: "0 8px 8px 0", margin: "20px 0" }}>
          <p style={{ color: "#fff", margin: "0 0 8px", fontStyle: "italic", fontSize: 18 }}>{settings?.text || ""}</p>
          {settings?.author && <cite style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>— {settings.author}</cite>}
        </blockquote>
      );
    
    case "button":
      const btnStyle = settings?.style === "filled" 
        ? { background: "#4a9eff", color: "#fff", border: "none" }
        : settings?.style === "outline"
        ? { background: "transparent", color: "#4a9eff", border: "2px solid #4a9eff" }
        : { background: "transparent", color: "#4a9eff", border: "none", textDecoration: "underline" };
      return (
        <div style={{ textAlign: align, margin: "20px 0" }}>
          <a href={settings?.url || "#"} style={{ ...btnStyle, padding: "14px 28px", borderRadius: 8, textDecoration: "none", display: "inline-block", fontWeight: 600 }}>
            {settings?.text || "Click Here"}
          </a>
        </div>
      );
    
    case "divider":
      return <hr style={{ border: "none", borderTop: `1px solid ${settings?.color || "rgba(255,255,255,0.2)"}`, width: `${settings?.width || 100}%`, margin: "30px 0" }} />;
    
    case "spacer":
      return <div style={{ height: settings?.height || 40 }} />;
    
    case "icon":
      return (
        <div style={{ textAlign: align, margin: "16px 0" }}>
          <span style={{ fontSize: settings?.size || 48, color: settings?.color || "#4a9eff" }}>★</span>
        </div>
      );
    
    case "social":
      return (
        <div style={{ textAlign: align, display: "flex", gap: 12, justifyContent: align === "center" ? "center" : "flex-start", margin: "20px 0" }}>
          {settings?.platforms?.map(platform => (
            <span key={platform} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", borderRadius: "50%", fontSize: 16 }}>
              {platform[0].toUpperCase()}
            </span>
          ))}
        </div>
      );
    
    case "search":
      return (
        <div style={{ textAlign: align, margin: "16px 0" }}>
          <input type="text" placeholder={settings?.placeholder || "Search..."} style={{ width: "100%", padding: "14px 18px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 15 }} disabled />
        </div>
      );
    
    default:
      return null;
  }
};

const CustomBlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`/api/custom-blogs/${id}`);
        setBlog(res.data);
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  if (loading) {
    return (
      <div className="custom-blog-detail">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="custom-blog-detail">
        <div className="error">Blog not found</div>
        <Link to="/blog" className="back-link">← Back to Blogs</Link>
      </div>
    );
  }

  return (
    <div className="custom-blog-detail">
      <article className="blog-article">
        <header className="blog-header">
          <div className="header-content">
            <h1>{blog.title}</h1>
            {blog.excerpt && <p className="excerpt">{blog.excerpt}</p>}
            <div className="meta">
              <span>{blog.author}</span>
              <span className="separator">•</span>
              <span>{formatDate(blog.publishedAt)}</span>
              <span className="separator">•</span>
              <span>{blog.readingTime || 1} min read</span>
            </div>
            {blog.tags?.length > 0 && (
              <div className="tags">
                {blog.tags.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
          {blog.coverImage && (
            <div className="cover-image">
              <img src={blog.coverImage} alt={blog.title} />
              {blog.coverImageCaption && <span className="caption">{blog.coverImageCaption}</span>}
            </div>
          )}
        </header>

        <div className="blog-body">
          {blog.sections?.length > 0 ? (
            blog.sections.map((section, sIdx) => (
              <div 
                key={sIdx} 
                className="blog-section"
                style={{
                  backgroundColor: section.backgroundColor || "transparent",
                  padding: `${section.padding || 40}px`,
                }}
              >
                <div className={`columns-layout cols-${section.layout || "1"}`}>
                  {section.columns?.map((column, cIdx) => (
                    <div key={cIdx} className="column">
                      {column.widgets?.map((widget, wIdx) => (
                        <WidgetRenderer key={wIdx} widget={widget} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
              No content yet. Start building your blog in the admin panel.
            </p>
          )}
        </div>
      </article>

      <Link to="/blog" className="back-link">← Back to Blogs</Link>
    </div>
  );
};

export default CustomBlogDetail;