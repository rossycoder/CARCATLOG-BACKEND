/**
 * Create a test user for bike association
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
    console.log('✅ Connected to MongoDB');

    console.log('👤 CREATING TEST USER');
    console.log('='.repeat(30));

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   ID: ${existingUser._id}`);
      return existingUser;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const testUser = new User({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      isEmailVerified: true,
      role: 'user'
    });

    const savedUser = await testUser.save();
    
    console.log('✅ Test user created successfully');
    console.log(`   Email: ${savedUser.email}`);
    console.log(`   ID: ${savedUser._id}`);
    console.log(`   Password: password123`);

    return savedUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the function
createTestUser();