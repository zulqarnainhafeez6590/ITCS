import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./JobDetail.scss";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/jobsAdd");
        const allJobs = Array.isArray(res.data) ? res.data : [];
        const foundJob = allJobs.find((j) => j._id === id);
        
        if (foundJob) {
          setJob(foundJob);
        } else if (location.state?.job) {
          setJob(location.state.job);
        } else {
          setError("Job not found");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        if (location.state?.job) {
          setJob(location.state.job);
        } else {
          setError("Failed to load job details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="job-detail-loading">
        <div className="loader"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-error">
        <h2>{error || "Job not found"}</h2>
        <button onClick={() => navigate("/careers")}>Back to Careers</button>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        <button className="back-btn" onClick={() => navigate("/careers")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to All Positions
        </button>

        <div className="job-detail-card">
          <div className="job-header">
            <div className="job-title-section">
              <span className="department-badge">{job.department}</span>
              <h1>{job.title}</h1>
              <div className="job-meta">
                <span className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {job.location}
                </span>
                <span className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                  </svg>
                  {job.type}
                </span>
                <span className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  {job.experience}
                </span>
                <span className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Posted: {formatDate(job.createdAt)}
                </span>
              </div>
            </div>
            <div className="apply-section">
              <button 
                className="apply-now-btn"
                onClick={() => navigate("/apply", { state: { job } })}
              >
                Apply Now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>

          <div className="job-content">
            <div className="content-section">
              <h2>Job Description</h2>
              <p>{job.description}</p>
            </div>

            <div className="content-section">
              <h2>Key Responsibilities</h2>
              <ul>
                <li>Collaborate with cross-functional teams to deliver high-quality solutions</li>
                <li>Participate in code reviews and contribute to technical documentation</li>
                <li>Mentor junior team members and contribute to team growth</li>
                <li>Stay updated with latest industry trends and best practices</li>
                <li>Contribute to architectural decisions and technical strategy</li>
              </ul>
            </div>

            <div className="content-section">
              <h2>Required Qualifications</h2>
              <ul>
                <li>Strong experience in relevant field</li>
                <li>Excellent problem-solving skills</li>
                <li>Good communication and teamwork abilities</li>
                <li>Passion for learning and innovation</li>
              </ul>
            </div>

            <div className="content-section">
              <h2>Why Join Us?</h2>
              <ul className="benefits-list">
                <li>Competitive salary and benefits package</li>
                <li>Remote and hybrid work options</li>
                <li>Professional development opportunities</li>
                <li>Collaborative and inclusive work environment</li>
                <li>Cutting-edge technology projects</li>
              </ul>
            </div>
          </div>

          <div className="job-footer">
            <div className="share-section">
              <span>Share this job:</span>
              <div className="share-buttons">
                <button className="share-btn" title="Copy Link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                </button>
              </div>
            </div>
            <button 
              className="apply-btn-large"
              onClick={() => navigate("/apply", { state: { job } })}
            >
              Apply for this Position
            </button>
          </div>
        </div>

        <div className="similar-jobs">
          <h3>Other Open Positions</h3>
          <button 
            className="view-all-btn"
            onClick={() => navigate("/careers")}
          >
            View All Jobs
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
