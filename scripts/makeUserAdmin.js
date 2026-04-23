require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeUserAdmin() {
  try {
    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node makeUserAdmin.js <email>');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('\n📋 User found:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Current isAdmin:', user.isAdmin);
    console.log('Current role:', user.role);

    // Update to admin
    user.isAdmin = true;
    user.role = 'admin';
    await user.save();

    console.log('\n✅ User updated to admin successfully!');
    console.log('New isAdmin:', user.isAdmin);
    console.log('New role:', user.role);

    console.log('\n📝 User needs to logout and login again to see admin features');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

makeUserAdmin();
