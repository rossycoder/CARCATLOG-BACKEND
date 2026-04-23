require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdminUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ 
      $or: [
        { isAdmin: true },
        { role: 'admin' }
      ]
    });

    console.log('\n📋 Admin Users Found:', adminUsers.length);
    console.log('='.repeat(80));

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
      console.log('\nRun this to create admin user:');
      console.log('node scripts/createAdminUser.js');
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Admin User:`);
        console.log('   ID:', user._id);
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   isAdmin:', user.isAdmin);
        console.log('   role:', user.role);
        console.log('   Email Verified:', user.isEmailVerified);
        console.log('   Created:', user.createdAt);
      });

      console.log('\n' + '='.repeat(80));
      console.log('📝 To login as admin, use these credentials in the frontend');
    }

    // Also show total users
    const totalUsers = await User.countDocuments();
    console.log('\n📊 Total Users in Database:', totalUsers);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkAdminUsers();
