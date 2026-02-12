const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

/**
 * Make a user admin by email
 * Usage: node make-admin.js <email>
 */
async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node make-admin.js <email>');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('\n💡 Available users:');
      const allUsers = await User.find({}, 'email name role isAdmin');
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name}) - Role: ${u.role}, Admin: ${u.isAdmin}`);
      });
      process.exit(1);
    }

    console.log('\n📊 Current User Data:');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Is Admin:', user.isAdmin);

    // Update to admin
    user.role = 'admin';
    user.isAdmin = true;
    await user.save();

    console.log('\n✅ User updated to admin!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Is Admin:', user.isAdmin);

    console.log('\n🎉 Admin access granted successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

makeAdmin();
