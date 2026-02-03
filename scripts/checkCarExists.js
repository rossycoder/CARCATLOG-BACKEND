/**
 * Check if car exists in database for the given advert ID
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const Car = require('../models/Car');

async function checkCarExists() {
  try {
    const advertId = '2609a53b-ea30-474c-85e0-6a25c5ede19d';
    
    console.log(`🔍 Checking if car exists for advert ID: ${advertId}`);
    
    // Check in Car collection
    const car = await Car.findOne({ advertId });
    
    if (car) {
      console.log('✅ Car found in database:');
      console.log('   Database ID:', car._id);
      console.log('   Advert ID:', car.advertId);
      console.log('   Make/Model:', car.make, car.model);
      console.log('   Registration:', car.registrationNumber);
      console.log('   Status:', car.advertStatus);
      console.log('   Running costs:');
      console.log('     - Urban MPG:', car.fuelEconomyUrban || 'Not set');
      console.log('     - Combined MPG:', car.fuelEconomyCombined || 'Not set');
      console.log('     - Annual Tax:', car.annualTax || 'Not set');
      console.log('     - CO2 Emissions:', car.co2Emissions || 'Not set');
      console.log('   Running costs object:', car.runningCosts);
    } else {
      console.log('❌ Car not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking car:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkCarExists();