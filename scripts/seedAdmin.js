require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ accountType: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('HireAdmin@123', salt);

    const admin = await User.create({
      name: 'Hireverse Admin',
      email: 'admin@hireverse.com',
      password: hashedPassword,
      accountType: 'admin',
      profileImage: `https://api.dicebear.com/7.x/adventurer/svg?seed=admin`,
      headline: 'Platform Administrator',
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Password: HireAdmin@123');
    console.log('   (Please change the password after first login)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
