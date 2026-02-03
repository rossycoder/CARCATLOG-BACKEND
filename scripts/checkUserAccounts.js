require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUserAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const targetEmail = 'shahzad872@live.com';
    
    // Check for exact email match
    console.log(`🔍 Searching for exact email: ${targetEmail}`);
    const exactUser = await User.findOne({ email: targetEmail });
    
    if (exactUser) {
      console.log('✅ Found exact match:', exactUser._id);
      return;
    }

    // Check for similar emails
    console.log('\n🔍 Searching for similar emails...');
    const similarUsers = await User.find({ 
      email: { $regex: 'shahzad', $options: 'i' } 
    });
    
    if (similarUsers.length > 0) {
      console.log(`Found ${similarUsers.length} similar users:`);
      similarUsers.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user._id})`);
      });
    } else {
      console.log('No similar users found');
    }

    // Check recent users
    console.log('\n👥 Recent users (last 10):');
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('email name createdAt');
    
    recentUsers.forEach(user => {
      console.log(`   - ${user.email} | ${user.name || 'No name'} | ${user.createdAt}`);
    });

    // Check if we should create the user
    console.log('\n💡 SOLUTION OPTIONS:');
    console.log('1. Create user account automatically with email: shahzad872@live.com');
    console.log('2. User needs to register manually with this email');
    console.log('3. Link car to existing user if they have different email');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserAccounts();