/**
 * Check latest car added
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkLatest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get latest car
    const car = await Car.findOne().sort({ createdAt: -1 });

    if (!car) {
      console.log('❌ No cars found!');
      return;
    }

    console.log('🚗 LATEST CAR ADDED:');
    console.log('═══════════════════════════════════════');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Created: ${car.createdAt.toLocaleString()}`);
    console.log(`   Advert ID: ${car.advertId}`);
    console.log('═══════════════════════════════════════\n');

    // Check if history exists
    if (car.registrationNumber) {
      const history = await VehicleHistory.findOne({ 
        vrm: car.registrationNumber.toUpperCase() 
      }).sort({ checkDate: -1 });

      if (history) {
        console.log('📋 VEHICLE HISTORY:');
        console.log('═══════════════════════════════════════');
        console.log(`   numberOfPreviousKeepers: ${history.numberOfPreviousKeepers}`);
        console.log(`   previousOwners: ${history.previousOwners}`);
        console.log(`   numberOfOwners: ${history.numberOfOwners}`);
        console.log(`   Keys: ${history.numberOfKeys || history.keys}`);
        console.log(`   Check Date: ${history.checkDate.toLocaleString()}`);
        console.log('═══════════════════════════════════════\n');

        if (history.numberOfPreviousKeepers === 0 && history.previousOwners === 0) {
          console.log('⚠️ WARNING: Owner count is 0!');
          console.log('   This means API returned 0 or data was not properly mapped\n');
        }
      } else {
        console.log('❌ No vehicle history found in database');
        console.log('   History should be fetched when car is created\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkLatest();
