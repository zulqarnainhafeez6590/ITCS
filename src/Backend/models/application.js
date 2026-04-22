import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  preferredLocation: String,
  jobTitle: String,
  jobDepartment: String,
  jobLocation: String,
  experience: String,
  linkedin: String,
  coverLetter: String,
  resumeFileName: String,
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  // Specifically name the collection to match user's request
  collection: 'itcs-db' 
});

export default mongoose.model('Application', applicationSchema);
