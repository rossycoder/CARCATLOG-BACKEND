require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function verifyUserEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'rossy4586879@gmail.com';

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    console.log('Found user:', user.name, '|', user.email);
    console.log('Current isEmailVerified:', user.isEmailVerified);

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('✅ Email verified successfully for:', email);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

verifyUserEmail();
