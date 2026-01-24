require('dotenv').config();
const mongoose = require('mongoose');

async function verifySchemaAndData() {
  try {
    console.log('🔍 Connecting to database...');
    const mongoUri = 'mongodb+srv://carcatlog:Rozeena%40123@cluster0.eeyiemx.mongodb.net/car-website?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Import Car model AFTER connecting to ensure schema is loaded
    const Car = require('../models/Car');
    
    const advertId = 'a1fe37e7-cd58-4584-89c8-200904318c7a';
    
    console.log('\n📋 Checking Car model schema...');
    const schema = Car.schema.paths;
    console.log('  - motDue field exists:', !!schema.motDue);
    console.log('  - motExpiry field exists:', !!schema.motExpiry);
    console.log('  - estimatedValue field exists:', !!schema.estimatedValue);
    console.log('  - fuelEconomyUrban field exists:', !!schema.fuelEconomyUrban);
    
    console.log('\n📊 Checking database record...');
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found in database');
      return;
    }
    
    console.log('\n✅ Car found:');
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Registration:', car.registrationNumber);
    console.log('\n💰 Price fields:');
    console.log('  price:', car.price);
    console.log('  estimatedValue:', car.estimatedValue);
    console.log('\n🔧 MOT fields:');
    console.log('  motDue:', car.motDue);
    console.log('  motExpiry:', car.motExpiry);
    console.log('  motStatus:', car.motStatus);
    console.log('\n💨 Running costs:');
    console.log('  fuelEconomyUrban:', car.fuelEconomyUrban);
    console.log('  fuelEconomyExtraUrban:', car.fuelEconomyExtraUrban);
    console.log('  fuelEconomyCombined:', car.fuelEconomyCombined);
    console.log('  annualTax:', car.annualTax);
    console.log('  co2Emissions:', car.co2Emissions);
    console.log('  insuranceGroup:', car.insuranceGroup);
    
    console.log('\n📝 Recommendations:');
    if (!car.price && !car.estimatedValue) {
      console.log('  ⚠️  No price data - run fixAdvertEditPageData.js to populate');
    }
    if (!car.motDue && !car.motExpiry) {
      console.log('  ⚠️  No MOT data - run fixAdvertEditPageData.js to populate');
    }
    if (!car.fuelEconomyUrban) {
      console.log('  ⚠️  No running costs - run fixAdvertEditPageData.js to populate');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

verifySchemaAndData();
