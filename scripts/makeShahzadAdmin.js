require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const makeUserAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      process.exit(1);
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const email = 'shahzad872@live.com';

    // Find user by email
    const user = await User.findOne({ email: email });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      console.log('Please make sure the user has registered first');
      process.exit(1);
    }

    // Update user to admin
    user.isAdmin = true;
    user.role = 'admin';
    await user.save();

    console.log('✅ User updated successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Admin Status:', user.isAdmin);
    console.log('🎭 Role:', user.role);
    console.log('📅 Created:', user.createdAt);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

makeUserAdmin();
