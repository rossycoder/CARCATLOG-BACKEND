require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

const ADVERT_ID = 'b80c840d-1765-4374-a42c-66f110853031';
const NEW_PRICE = 16670;

async function fixAdvertPrice() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the car by advertId
    const car = await Car.findOne({ advertId: ADVERT_ID });
    
    if (!car) {
      console.log('❌ Car not found with advertId:', ADVERT_ID);
      return;
    }
    
    console.log('📝 Current car data:');
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Current Price:', car.price);
    console.log('   Year:', car.year);
    console.log('   Mileage:', car.mileage);
    
    // Update the price
    car.price = NEW_PRICE;
    await car.save();
    
    console.log('✅ Price updated to:', NEW_PRICE);
    console.log('✅ Advert fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixAdvertPrice();
