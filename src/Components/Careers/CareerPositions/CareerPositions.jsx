import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CareerPositions.scss";

const CareerPositions = () => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [loading, setLoading] = useState(false);

  const departments = [
    "All",
    "Engineering",
    "Design",
    "Security",
    "Product",
    "Sales",
    "Marketing",
    "HR",
  ];

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/jobsAdd");
        setPositions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error loading jobs:", err);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const filteredPositions =
    selectedDepartment === "All"
      ? positions
      : positions.filter((pos) => pos.department === selectedDepartment);

  return (
    <section className="career-positions" id="positions">
      <div className="positions-container">
        <div className="section-header">
          <span className="section-badge">OPEN POSITIONS</span>
          <h2>Find Your Perfect Role</h2>
          <p>Explore our current openings and take the next step in your career journey.</p>
        </div>

        <div className="department-filter">
          {departments.map((dept) => (
            <button
              key={dept}
              className={`filter-btn ${selectedDepartment === dept ? "active" : ""}`}
              onClick={() => setSelectedDepartment(dept)}
            >
              {dept}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading positions...</p>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="no-positions">
            <p>No positions available in this department at the moment.</p>
          </div>
        ) : (
          <div className="positions-grid">
            {filteredPositions.map((position) => (
              <div key={position._id} className="position-card">
                <div className="position-header">
                  <div className="position-meta">
                    <span className="department-tag">{position.department}</span>
                    <span className="type-tag">{position.type}</span>
                  </div>
                  <h3>{position.title}</h3>
                </div>
                <div className="position-details">
                  <div className="detail">
                    <span className="icon">📍</span>
                    <span>{position.location}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">💼</span>
                    <span>{position.experience}</span>
                  </div>
                </div>
                <p className="position-description">{position.description}</p>
                <button
                  className="view-details-btn"
                  onClick={() => navigate(`/job/${position._id}`, { state: { job: position } })}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CareerPositions;
