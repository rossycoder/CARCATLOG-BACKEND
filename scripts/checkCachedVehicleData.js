require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCachedVehicleData() {
  try {
    console.log('🔍 Checking Cached Vehicle Data');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const registration = 'EK11XHZ';
    const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
    
    console.log(`Looking for cached data for: ${cleanedReg}`);
    
    const cached = await VehicleHistory.findOne({ vrm: cleanedReg });
    
    if (!cached) {
      console.log('❌ No cached data found');
      return;
    }
    
    console.log('\n📋 Cached Vehicle Data:');
    console.log('VRM:', cached.vrm);
    console.log('Make:', cached.make);
    console.log('Model:', cached.model);
    console.log('Variant:', cached.variant);
    console.log('Year:', cached.yearOfManufacture);
    console.log('Color:', cached.colour);
    console.log('FuelType:', cached.fuelType);
    console.log('Transmission:', cached.transmission);
    console.log('EngineCapacity:', cached.engineCapacity);
    console.log('BodyType:', cached.bodyType);
    console.log('Doors:', cached.doors);
    console.log('Seats:', cached.seats);
    console.log('PreviousOwners:', cached.numberOfPreviousKeepers);
    console.log('Gearbox:', cached.gearbox);
    console.log('EmissionClass:', cached.emissionClass);
    console.log('CO2Emissions:', cached.co2Emissions);
    console.log('CheckDate:', cached.checkDate);
    console.log('APIProvider:', cached.apiProvider);
    
    console.log('\n🔍 Missing Fields in Cache:');
    const missingFields = [];
    
    if (!cached.bodyType) missingFields.push('bodyType');
    if (!cached.doors) missingFields.push('doors');
    if (!cached.seats) missingFields.push('seats');
    if (!cached.variant) missingFields.push('variant');
    if (!cached.gearbox) missingFields.push('gearbox');
    if (!cached.emissionClass) missingFields.push('emissionClass');
    if (!cached.co2Emissions) missingFields.push('co2Emissions');
    
    if (missingFields.length > 0) {
      console.log('❌ Missing fields in cache:', missingFields.join(', '));
      console.log('   These fields need to be fetched from fresh API call');
    } else {
      console.log('✅ All expected fields are present in cache');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkCachedVehicleData();