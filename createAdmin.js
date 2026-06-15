const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hireverse');
    console.log('Connected to DB');

    const email = 'admin@123';
    const password = '12345';
    
    // Check if exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin already exists. Deleting it to recreate...');
      await User.deleteOne({ email });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name: 'Main Admin',
      email,
      password: hashedPassword,
      accountType: 'admin'
    });

    await user.save();
    console.log('Admin account created successfully:');
    console.log('Email:', email);
    console.log('Password:', password);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
