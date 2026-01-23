require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testEmailVerification() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find a user with unverified email
    const user = await User.findOne({ isEmailVerified: false })
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      console.log('❌ No unverified users found');
      process.exit(0);
    }

    console.log('\n📧 Unverified User:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Has Token:', !!user.emailVerificationToken);
    console.log('   Token:', user.emailVerificationToken);
    console.log('   Token Expires:', user.emailVerificationExpires);
    console.log('   Is Expired:', user.emailVerificationExpires < new Date());

    if (user.emailVerificationToken) {
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

testEmailVerification();
