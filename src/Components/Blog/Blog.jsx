import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Blog.scss";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/custom-blogs?status=published`);
        const customBlogsData = response.data || [];

        const allBlogs = customBlogsData.map(blog => ({
          ...blog,
          isCustom: true,
          description: blog.excerpt,
          readable_publish_date: blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
          reading_time_minutes: blog.readingTime || 5,
          tag_list: blog.tags || []
        })).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        setPosts(allBlogs);
      } catch (err) {
        console.error("Failed to load blogs:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const filteredPosts = posts;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="blog-public-container">
      <h2 className="blog-public-title">Our Blogs</h2>

      {loading && <p className="loading-text">Loading blogs...</p>}

      <div className="blog-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <article key={post.isCustom ? post._id : post.id} className="blog-card">
              <div className="blog-card__content">
                {(post.cover_image || post.social_image || post.coverImage) && (
                  <img
                    src={post.cover_image || post.social_image || post.coverImage}
                    alt={post.title}
                    className="blog-cover"
                    loading="lazy"
                  />
                )}

                <h3>{post.title}</h3>

                <p className="meta">
                  {post.displayAuthor || post.author} • {post.displayDate || post.readable_publish_date} • {post.reading_time_minutes} min read
                </p>

                <p className="description">{post.description}</p>

                <div className="tags-small">
                  {post.tag_list?.slice(0, 3).map(tag => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>

                <Link to={post.isCustom ? `/custom-blog/${post._id}` : `/blog/${post.id}`} className="read-more">
                  Read more
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="no-posts">
            {loading ? "Loading..." : "No blogs found for this tag."}
          </p>
        )}
      </div>
    </div>
  );
}
