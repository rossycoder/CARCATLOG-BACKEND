require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixAdvertEditPageDisplay() {
  try {
    console.log('🔍 Connecting to database...');
    // Use cloud MongoDB
    const mongoUri = 'mongodb+srv://carcatlog:Rozeena%40123@cluster0.eeyiemx.mongodb.net/car-website?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    const advertId = 'a1fe37e7-cd58-4584-89c8-200904318c7a';
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('\n📊 Current Car Data:');
    console.log('  Advert ID:', car.advertId);
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Price:', car.price);
    console.log('  Estimated Value:', car.estimatedValue);
    console.log('  motDue:', car.motDue);
    console.log('  motExpiry:', car.motExpiry);
    console.log('  motStatus:', car.motStatus);
    
    // Fix the data
    const updates = {};
    let needsUpdate = false;
    
    // Ensure price is set
    if (!car.price && car.estimatedValue) {
      updates.price = car.estimatedValue;
      needsUpdate = true;
      console.log('\n💰 Setting price to estimated value:', car.estimatedValue);
    }
    
    // Ensure motDue is set from motExpiry if missing
    if (!car.motDue && car.motExpiry) {
      updates.motDue = car.motExpiry;
      needsUpdate = true;
      console.log('🔧 Setting motDue from motExpiry:', car.motExpiry);
    }
    
    // If we have motExpiry but no motStatus, set it
    if (car.motExpiry && !car.motStatus) {
      const expiryDate = new Date(car.motExpiry);
      const now = new Date();
      updates.motStatus = expiryDate > now ? 'Valid' : 'Not valid';
      needsUpdate = true;
      console.log('🔧 Setting motStatus:', updates.motStatus);
    }
    
    if (needsUpdate) {
      await Car.updateOne({ advertId }, { $set: updates });
      console.log('\n✅ Updated car data successfully');
      
      // Verify the update
      const updatedCar = await Car.findOne({ advertId });
      console.log('\n📊 Updated Car Data:');
      console.log('  Price:', updatedCar.price);
      console.log('  motDue:', updatedCar.motDue);
      console.log('  motExpiry:', updatedCar.motExpiry);
      console.log('  motStatus:', updatedCar.motStatus);
    } else {
      console.log('\n✅ No updates needed - data is already correct');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

fixAdvertEditPageDisplay();
