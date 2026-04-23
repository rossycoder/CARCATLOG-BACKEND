require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User'); // Add User model

async function testDraftCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find any active car
    const activeCar = await Car.findOne({ advertStatus: 'active' }).limit(1);
    
    if (!activeCar) {
      console.log('No active cars found to test with');
      process.exit(0);
    }

    console.log('\n=== BEFORE ===');
    console.log('Car ID:', activeCar._id);
    console.log('Advert ID:', activeCar.advertId);
    console.log('Make/Model:', activeCar.make, activeCar.model);
    console.log('Status:', activeCar.advertStatus);
    console.log('User ID:', activeCar.userId);

    // Move to draft
    activeCar.advertStatus = 'draft';
    await activeCar.save();

    console.log('\n=== AFTER ===');
    console.log('Status:', activeCar.advertStatus);
    console.log('\n✅ Car moved to draft successfully!');
    console.log('Now check My Listings page to see if it appears');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDraftCar();
