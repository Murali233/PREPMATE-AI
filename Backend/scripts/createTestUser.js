require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('../models/User');

// Test user data
const testUser = {
  name: 'Muralidhar',
  email: 'muralidhar.5695233@gmail.com',
  password: 'murali@123' // This will be hashed before saving
};

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

async function createTestUser() {
  try {
    // Connect to the database first
    await connectDB();
    
    console.log('Checking if user exists...');
    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      console.log('User details:', {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        createdAt: existingUser.createdAt
      });
      process.exit(0);
    }

    console.log('Hashing password...');
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);

    console.log('Creating new user...');
    // Create new user
    const user = await User.create({
      name: testUser.name,
      email: testUser.email,
      password: hashedPassword,
      profileImageUrl: null
    });

    console.log('✅ User created successfully:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      profileImageUrl: user.profileImageUrl
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    if (error.name === 'MongoServerError' && error.code === 8000) {
      console.error('Authentication failed. Please check your MongoDB Atlas username and password.');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('Could not connect to MongoDB. Please check your connection string and network.');
    }
    process.exit(1);
  }
}

createTestUser();
