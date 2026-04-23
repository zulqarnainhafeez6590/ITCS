import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import CustomBlog from './models/customBlog.js';

dotenv.config({ path: path.resolve('src/Backend/.env') });

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await CustomBlog.updateMany(
    { publishedAt: null, status: 'published' },
    [
      { $set: { publishedAt: '$createdAt' } }
    ]
  );
  console.log('Update result:', result);
  process.exit(0);
}
fix();
