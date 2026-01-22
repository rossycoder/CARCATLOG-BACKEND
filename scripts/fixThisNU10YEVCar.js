/**
 * Fix NU10YEV car - fetch variant from API and update
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function fixThisNU10YEVCar() {
  try {
    console.log('🔧 Fixing NU10YEV car...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const vrm = 'NU10YEV';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ Car not found!');
      return;
    }
    
    console.log('📦 Current car data:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Variant: ${car.variant}`);
    console.log(`   Data Sources:`, car.dataSources);
    
    // Fetch fresh data from API
    console.log('\n🔍 Fetching data from API...');
    const vehicleData = await enhancedVehicleService.getEnhancedVehicleData(vrm, false);
    
    console.log('\n📦 API Response:');
    console.log(`   Variant: "${vehicleData.variant?.value}"`);
    console.log(`   ModelVariant: "${vehicleData.modelVariant?.value}"`);
    
    // Update car with variant
    if (vehicleData.variant?.value) {
      car.variant = vehicleData.variant.value;
      car.dataSources = {
        dvla: false,
        checkCarDetails: true,
        lastUpdated: new Date()
      };
      
      await car.save();
      
      console.log('\n✅ Car updated successfully!');
      console.log(`   New variant: "${car.variant}"`);
    } else {
      console.log('\n⚠️  No variant found in API response');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

fixThisNU10YEVCar();
