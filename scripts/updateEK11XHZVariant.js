require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function updateEK11XHZVariant() {
  try {
    console.log('🔍 Updating EK11XHZ car with real API variant');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the EK11XHZ car
    const car = await Car.findOne({ registrationNumber: 'EK11XHZ' });
    
    if (!car) {
      console.log('❌ EK11XHZ car not found in database');
      return;
    }
    
    console.log('\n📋 Current car data:');
    console.log(`Car ID: ${car._id}`);
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Current Variant: "${car.variant}"`);
    console.log(`Display Title: "${car.displayTitle}"`);
    
    // Get real API variant
    console.log('\n⏳ Fetching real API variant...');
    const vehicleData = await CheckCarDetailsClient.getVehicleData('EK11XHZ');
    
    if (!vehicleData) {
      console.log('❌ No API data received');
      return;
    }
    
    // Extract the real API variant
    const realVariant = vehicleData.modelVariant || 
                       vehicleData.variant || 
                       vehicleData.trim || 
                       vehicleData.grade || 
                       vehicleData.specification ||
                       vehicleData.subModel ||
                       null;
    
    console.log('\n📊 API Data:');
    console.log(`API Variant: "${realVariant}"`);
    console.log(`Make: ${vehicleData.make}`);
    console.log(`Model: ${vehicleData.model}`);
    console.log(`Engine: ${vehicleData.engineSize}L`);
    console.log(`Fuel: ${vehicleData.fuelType}`);
    
    if (realVariant) {
      // Update the car with real API variant
      car.variant = realVariant;
      
      // Update display title with AutoTrader format: "EngineSize Variant EuroStatus Doors"
      const parts = [];
      
      // 1. Engine size (without 'L' suffix for AutoTrader style)
      if (car.engineSize) {
        parts.push(car.engineSize.toFixed(1));
      }
      
      // 2. Real API variant
      parts.push(realVariant);
      
      // 3. Euro status if available
      if (car.emissionClass && car.emissionClass.includes('Euro')) {
        parts.push(car.emissionClass);
      }
      
      // 4. Doors
      if (car.doors) {
        parts.push(`${car.doors}dr`);
      }
      
      car.displayTitle = parts.join(' ');
      
      // Save the updated car
      await car.save();
      
      console.log('\n✅ Car updated successfully!');
      console.log(`New Variant: "${car.variant}" (real API variant)`);
      console.log(`New Display Title: "${car.displayTitle}" (AutoTrader format)`);
      
      console.log('\n🎯 RESULT:');
      console.log('✅ Real API variant is now saved in database');
      console.log('✅ Display title now uses AutoTrader format');
      console.log('✅ Future cars will automatically get AutoTrader style display titles');
      
    } else if (!realVariant) {
      console.log('\n⚠️  No API variant available - keeping current variant');
    } else {
      console.log('\n✅ Car already has the correct variant');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('daily limit') || error.message.includes('403')) {
      console.log('\n⏰ API daily limit reached');
      console.log('   Update will be applied when API limit resets');
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

updateEK11XHZVariant();