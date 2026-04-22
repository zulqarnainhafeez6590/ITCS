import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobList.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faClock, faTrash, faClipboardList, faCircleMinus } from '@fortawesome/free-solid-svg-icons';


const JobList = () => {
  const [jobs, setJobs] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('All')
  const [loading, setLoading] = useState(false)

  const departments = ['All', 'Engineering', 'Design', 'Security', 'Product', 'Sales', 'Marketing', 'HR']

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:5000/api/jobsAdd');
      setJobs(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Error loading jobs:', err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return
    try {
      await axios.delete(`http://localhost:5000/api/jobsAdd/${jobId}`);
      setJobs(prev => prev.filter(job => job._id !== jobId))
    } catch (err) {
      console.error('Error deleting job:', err)
      alert('Failed to delete job')
    }
  }

  const filteredJobs = selectedDepartment === 'All'
    ? jobs
    : jobs.filter(job => job.department === selectedDepartment)


  return (
    <div className="job-list">
      <div className="job-list-header">
        <div className="header-info">
          <h2>Job List</h2>
          <p>You have {jobs.length} active positions</p>
        </div>
        <button className="refresh-btn" onClick={loadJobs}>
          Refresh List
        </button>
      </div>

      <div className="department-filter">
        {departments.map(dept => (
          <button 
            key={dept} 
            className={`filter-btn ${selectedDepartment === dept ? 'active' : ''}`} 
            onClick={() => setSelectedDepartment(dept)}
          >
            {dept}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><p>Loading jobs...</p></div>
      ) : filteredJobs.length === 0 ? (
        <div className="no-jobs">
          <h3>No jobs found</h3>
          <p>{selectedDepartment === 'All' ? 'Start by posting your first job.' : `No jobs currently in ${selectedDepartment}.`}</p>
        </div>
      ) : (
        <div className="jobs-container">
          {filteredJobs.map(job => (
            <div key={job._id} className="job-item">
              <div className="job-info">
                <h3>{job.title}</h3>
                <div className="job-meta">
                  <div className="meta-tag">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {job.location}
                  </div>
                  <div className="meta-tag">
                    <FontAwesomeIcon icon={faClock} /> {job.experience}
                  </div>
                  <div className="meta-tag">
                    <FontAwesomeIcon icon={faClipboardList} /> {job.department}
                  </div>
                </div>
              </div>
              <div className="job-actions">
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(job._id)}
                  title="Remove Job"
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
