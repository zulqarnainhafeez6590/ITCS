import React, { useState } from 'react';
import axios from 'axios';
import './PostJob.scss';

const PostJob = () => {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    experience: '',
    description: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = ['Engineering', 'Design', 'Security', 'Product', 'Sales', 'Marketing', 'HR'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.department || !formData.location || !formData.experience || !formData.description) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      setLoading(true);
      // Change POST URL to match the new route
      const res = await axios.post('http://localhost:5000/api/jobsAdd', formData);
      setSuccess('Job posted successfully!');

      setFormData({
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        experience: '',
        description: ''
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job">
      <div className="post-job-header">
        <h1>Create Opportunity</h1>
        <p>Post a new career opening to your global team</p>
      </div>

      <div className="post-job-card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="job-form">

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Job Title *</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <select id="department" name="department" value={formData.department} onChange={handleChange} required>
                <option value="">Select Department</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="type">Job Type *</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} required>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>


          <div className="form-group">
            <label htmlFor="experience">Experience Required *</label>
            <input type="text" id="experience" name="experience" value={formData.experience} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="6" required />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
