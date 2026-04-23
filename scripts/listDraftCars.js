require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User'); // Add User model

async function listDraftCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all draft cars
    const draftCars = await Car.find({ advertStatus: 'draft' })
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });
    
    console.log(`\n=== DRAFT CARS (${draftCars.length}) ===\n`);

    if (draftCars.length === 0) {
      console.log('No draft cars found in database');
      console.log('\nTo test, run: node backend/scripts/testDraftCar.js');
    } else {
      draftCars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} (${car.year})`);
        console.log(`   ID: ${car._id}`);
        console.log(`   Advert ID: ${car.advertId}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   User: ${car.userId?.email || 'Unknown'}`);
        console.log(`   Created: ${car.createdAt}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listDraftCars();
