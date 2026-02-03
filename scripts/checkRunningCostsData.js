require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkRunningCostsData() {
  try {
    console.log('🔍 Checking Running Costs Data');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const registration = 'EK11XHZ';
    const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
    
    console.log(`Looking for running costs data for: ${cleanedReg}`);
    
    const cached = await VehicleHistory.findOne({ vrm: cleanedReg });
    
    if (!cached) {
      console.log('❌ No cached data found');
      return;
    }
    
    console.log('\n📋 Running Costs Data in Database:');
    console.log('Urban MPG:', cached.urbanMpg);
    console.log('Extra Urban MPG:', cached.extraUrbanMpg);
    console.log('Combined MPG:', cached.combinedMpg);
    console.log('Annual Tax:', cached.annualTax);
    console.log('CO2 Emissions:', cached.co2Emissions);
    console.log('Insurance Group:', cached.insuranceGroup);
    
    console.log('\n🔍 Missing Running Costs Fields:');
    const missingFields = [];
    
    if (!cached.urbanMpg) missingFields.push('urbanMpg');
    if (!cached.extraUrbanMpg) missingFields.push('extraUrbanMpg');
    if (!cached.combinedMpg) missingFields.push('combinedMpg');
    if (!cached.annualTax) missingFields.push('annualTax');
    if (!cached.insuranceGroup) missingFields.push('insuranceGroup');
    
    if (missingFields.length > 0) {
      console.log('❌ Missing running costs fields:', missingFields.join(', '));
      console.log('   These fields need to be fetched from API and saved');
    } else {
      console.log('✅ All running costs fields are present');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkRunningCostsData();