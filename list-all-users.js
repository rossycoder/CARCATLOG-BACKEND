const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}, 'email name role isAdmin createdAt');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📊 Total Users: ${users.length}\n`);
    console.log('═══════════════════════════════════════════════════════════');
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Is Admin: ${user.isAdmin ? '✅ YES' : '❌ NO'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    
    // Count admins
    const adminCount = users.filter(u => u.isAdmin || u.role === 'admin').length;
    console.log(`\n👑 Admin Users: ${adminCount}`);
    console.log(`👤 Regular Users: ${users.length - adminCount}`);
    
    if (adminCount === 0) {
      console.log('\n💡 To make a user admin, run:');
      console.log('   node make-admin.js <email>');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

listAllUsers();
