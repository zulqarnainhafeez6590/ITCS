import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

const createInitialAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for Admin seeding...');

    const email = 'zulqarnain.hafeez@itcs.com';
    let user = await User.findOne({ username: 'zulqarnain.hafeez' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    if (user) {
      console.log('Admin user exists. Updating details...');
      user.email = email;
      user.fullName = 'Zulqarnain Hafeez';
      user.password = hashedPassword;
      await user.save();
    } else {
      user = new User({
        fullName: 'Zulqarnain Hafeez',
        username: 'zulqarnain.hafeez',
        email: email,
        password: hashedPassword,
        role: 'admin',
        isAdmin: true,
      });
      await user.save();
      console.log('--- Initial Admin Created Successfully ---');
    }

    console.log('Email:', email);
    console.log('Password: admin123');
    console.log('------------------------------------------');

    process.exit();
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

createInitialAdmin();
