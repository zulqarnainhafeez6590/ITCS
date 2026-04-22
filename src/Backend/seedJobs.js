import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/job.js';

dotenv.config();

const jobs = [
  {
    title: 'IT Sales Specialist',
    department: 'Sales',
    type: 'Full-time',
    location: 'Karachi',
    experience: '2-4 Years',
    description: 'We are looking for a motivated IT Sales Specialist to help grow our business. Your role will include finding new customers, explaining our products and services, and closing deals. If you have strong communication skills and enjoy talking to clients by phone or email, we want to meet you.'
  },
  {
    title: 'Tender Specialist',
    department: 'Operations',
    type: 'Full-time',
    location: 'Islamabad',
    experience: '1-3 Years',
    description: 'As a Tender Specialist at ITCS, you will be responsible for preparing and submitting tenders and proposals. You will work closely with technical teams to ensure all requirements are met and submissions are high quality.'
  },
  {
    title: 'HR Executive',
    department: 'HR',
    type: 'Full-time',
    location: 'Islamabad',
    experience: '1-2 Years',
    description: 'We are looking for an HR Executive to manage our recruitment, onboarding, and employee relations. You will be the point of contact for employees and will help in maintaining a positive workspace.'
  },
  {
    title: 'IT Sales Executive',
    department: 'Sales',
    type: 'Full-time',
    location: 'Lahore, Karachi & Rawalpindi',
    experience: '1-3 Years',
    description: 'Responsible for driving sales and revenue growth. You will identify potential clients, present IT solutions, and build long-term relationships to ensure business success.'
  },
  {
    title: 'Microsoft Defender EDR/XDR Specialist',
    department: 'Security',
    type: 'Full-time',
    location: 'Islamabad',
    experience: '3-5 Years',
    description: 'Expert in implementing and managing Microsoft Defender EDR/XDR solutions. You will be responsible for protecting our clients infrastructure from cyber threats and ensuring security compliance.'
  },
  {
    title: 'ITCS Internship Program',
    department: 'Engineering',
    type: 'Internship',
    location: 'Islamabad, Lahore, Karachi',
    experience: 'Fresh Graduate',
    description: 'Join our internship program to gain hands-on experience in the IT industry. We offer opportunities in software development, network security, and IT consulting.'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');
    
    // Clear existing jobs to avoid duplicates during testing
    await Job.deleteMany({});
    console.log('Cleared existing jobs.');
    
    await Job.insertMany(jobs);
    console.log('Jobs seeded successfully!');
    
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
