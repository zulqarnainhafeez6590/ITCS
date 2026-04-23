import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import CustomBlog from './models/customBlog.js';

dotenv.config({ path: path.resolve('src/Backend/.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const counts = await CustomBlog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  console.log('Counts by status:', JSON.stringify(counts, null, 2));
  
  const sample = await CustomBlog.findOne({ status: 'published' }).select('title status');
  console.log('Sample published blog:', sample);
  
  process.exit(0);
}
check();
