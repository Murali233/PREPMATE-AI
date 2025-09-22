const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_prep_app')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import User model
const User = require('../models/User');

async function checkUser() {
  try {
    const user = await User.findOne({ email: 'muralidhar.5695233@gmail.com' });
    if (user) {
      console.log('User found in database:');
      console.log({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      });
    } else {
      console.log('User not found in database');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
}

checkUser();
