require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAdvertMOTData() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    const advertId = 'a1fe37e7-cd58-4584-89c8-200904318c7a';
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('\n📊 Car Data in Database:');
    console.log('  Advert ID:', car.advertId);
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Price:', car.price);
    console.log('  Estimated Value:', car.estimatedValue);
    console.log('\n🔧 MOT Fields:');
    console.log('  motDue:', car.motDue);
    console.log('  motExpiry:', car.motExpiry);
    console.log('  motStatus:', car.motStatus);
    console.log('\n💰 Running Costs:');
    console.log('  fuelEconomyUrban:', car.fuelEconomyUrban);
    console.log('  fuelEconomyExtraUrban:', car.fuelEconomyExtraUrban);
    console.log('  fuelEconomyCombined:', car.fuelEconomyCombined);
    console.log('  annualTax:', car.annualTax);
    console.log('  co2Emissions:', car.co2Emissions);
    console.log('  insuranceGroup:', car.insuranceGroup);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

checkAdvertMOTData();
