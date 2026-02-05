#!/usr/bin/env node

/**
 * Fix Missing UserId for BG22UCP Car
 * 
 * This script adds the missing userId to the BG22UCP car so it appears in My Listings
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function fixMissingUserId() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    // Find the BG22UCP car
    const car = await Car.findOne({ registrationNumber: 'BG22UCP' });
    if (!car) {
      console.log('❌ Car BG22UCP not found');
      return;
    }

    console.log('🚗 Found car:', {
      id: car._id,
      registration: car.registrationNumber,
      advertId: car.advertId,
      userId: car.userId,
      email: car.sellerContact?.email
    });

    // Check if car already has userId
    if (car.userId) {
      console.log('✅ Car already has userId:', car.userId);
      return;
    }

    // Find user by email from sellerContact
    const email = car.sellerContact?.email;
    if (!email) {
      console.log('❌ No email found in sellerContact');
      return;
    }

    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ No user found with email:', email);
      console.log('💡 You may need to create a user account first');
      return;
    }

    console.log('👤 Found user:', {
      id: user._id,
      email: user.email,
      name: user.name
    });

    // Update car with userId
    car.userId = user._id;
    await car.save();

    console.log('✅ Car updated with userId:', user._id);
    console.log('🎉 Car should now appear in My Listings!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

// Run the fix
fixMissingUserId();