/**
 * Fix variant field for RJ08 PFA Honda Civic
 * This script fetches fresh API data and updates the variant field
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const enhancedVehicleService = require('../services/enhancedVehicleService');
const connectDB = require('../config/database');

async function fixVariant() {
  try {
    console.log('🔧 Fixing variant for RJ08 PFA...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: 'RJ08 PFA' });
    
    if (!car) {
      console.log('❌ Car not found with registration RJ08 PFA');
      return;
    }
    
    console.log('📋 Current car data:');
    console.log(`   Make: ${car.make}`);
    console.log(`   Model: ${car.model}`);
    console.log(`   Variant: ${car.variant || 'MISSING'}`);
    console.log(`   Engine Size: ${car.engineSize}L`);
    console.log(`   Fuel Type: ${car.fuelType}`);
    console.log(`   Transmission: ${car.transmission}\n`);
    
    // Fetch fresh API data
    console.log('🌐 Fetching fresh API data...');
    const enhancedData = await enhancedVehicleService.getEnhancedVehicleData('RJ08PFA', false);
    
    console.log('\n📊 API Response:');
    console.log(`   Variant: ${enhancedData.variant?.value || 'NOT PROVIDED'}`);
    console.log(`   Model Variant: ${enhancedData.modelVariant?.value || 'NOT PROVIDED'}`);
    
    // Extract variant
    const variant = enhancedData.variant?.value || enhancedData.modelVariant?.value;
    
    if (!variant) {
      console.log('\n⚠️  API did not provide variant data');
      return;
    }
    
    // Update the car
    console.log(`\n💾 Updating car with variant: "${variant}"`);
    car.variant = variant;
    await car.save();
    
    console.log('✅ Car updated successfully!\n');
    console.log('📋 Updated car data:');
    console.log(`   Make: ${car.make}`);
    console.log(`   Model: ${car.model}`);
    console.log(`   Variant: ${car.variant}`);
    console.log(`   Engine Size: ${car.engineSize}L`);
    console.log(`   Fuel Type: ${car.fuelType}`);
    console.log(`   Transmission: ${car.transmission}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

fixVariant();
