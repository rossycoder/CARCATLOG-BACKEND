/**
 * Check what data is cached for YD17AVU in VehicleHistory
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkYD17AVUCache() {
  try {
    console.log('🔍 Checking YD17AVU Cache in VehicleHistory');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const VehicleHistory = require('../models/VehicleHistory');
    
    const cachedData = await VehicleHistory.findOne({ vrm: 'YD17AVU' }).sort({ createdAt: -1 });
    
    if (!cachedData) {
      console.log('❌ No cache found for YD17AVU');
      process.exit(0);
    }
    
    console.log('✅ Found cached data:\n');
    console.log('📋 Basic Info:');
    console.log(`   VRM: ${cachedData.vrm}`);
    console.log(`   Make: ${cachedData.make}`);
    console.log(`   Model: ${cachedData.model}`);
    console.log(`   Variant: ${cachedData.variant}`);
    console.log(`   Year: ${cachedData.yearOfManufacture}`);
    
    console.log('\n🚗 Vehicle Details:');
    console.log(`   Fuel Type: ${cachedData.fuelType}`);
    console.log(`   Transmission: ${cachedData.transmission}`);
    console.log(`   Body Type: ${cachedData.bodyType}`);
    console.log(`   Engine Capacity: ${cachedData.engineCapacity}`);
    console.log(`   Color: ${cachedData.colour}`);
    console.log(`   Doors: ${cachedData.doors}`);
    console.log(`   Seats: ${cachedData.seats}`);
    
    console.log('\n📊 History Data:');
    console.log(`   Previous Owners: ${cachedData.previousOwners}`);
    console.log(`   Mileage: ${cachedData.mileage}`);
    console.log(`   MOT Expiry: ${cachedData.motExpiryDate}`);
    console.log(`   Tax Status: ${cachedData.taxStatus}`);
    
    console.log('\n💰 Valuation:');
    console.log(`   Estimated Value: ${cachedData.estimatedValue}`);
    console.log(`   Private Price: ${cachedData.privatePrice}`);
    console.log(`   Trade Price: ${cachedData.tradePrice}`);
    
    console.log('\n📅 Timestamps:');
    console.log(`   Created: ${cachedData.createdAt}`);
    console.log(`   Updated: ${cachedData.updatedAt}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ALL FIELDS IN DOCUMENT:');
    console.log(JSON.stringify(cachedData.toObject(), null, 2));
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkYD17AVUCache();
