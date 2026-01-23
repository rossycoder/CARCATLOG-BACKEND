require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUserVerificationStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node checkUserVerificationStatus.js <email>');
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+emailVerificationToken +emailVerificationExpires +password');

    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(0);
    }

    console.log('\n👤 User Details:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Email Verified:', user.isEmailVerified);
    console.log('   Has Password:', !!user.password);
    console.log('   Created:', user.createdAt);
    
    console.log('\n🔐 Verification Token:');
    console.log('   Has Token:', !!user.emailVerificationToken);
    if (user.emailVerificationToken) {
      console.log('   Token:', user.emailVerificationToken);
      console.log('   Expires:', user.emailVerificationExpires);
      console.log('   Is Expired:', user.emailVerificationExpires < new Date());
      console.log('   Time Until Expiry:', Math.round((user.emailVerificationExpires - new Date()) / 1000 / 60), 'minutes');
      
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`;
      console.log('\n🔗 Verification URL:');
      console.log(verificationUrl);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserVerificationStatus();
