require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testPriceUpdate() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the car with the specific advertId
    const advertId = process.argv[2];
    
    if (!advertId) {
      console.log('❌ Please provide an advertId as argument');
      console.log('Usage: node testPriceUpdate.js <advertId>');
      process.exit(1);
    }
    
    console.log(`\n🔍 Looking for advert: ${advertId}`);
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    console.log('\n📊 Current car data:');
    console.log('Make/Model:', car.make, car.model);
    console.log('Current Price:', car.price);
    console.log('Advert Status:', car.advertStatus);
    
    // Test updating the price
    const newPrice = 20000;
    console.log(`\n💰 Testing price update to: £${newPrice}`);
    
    car.price = newPrice;
    await car.save();
    
    console.log('✅ Price updated successfully');
    
    // Verify the update
    const updatedCar = await Car.findOne({ advertId });
    console.log('\n✅ Verified - New price:', updatedCar.price);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testPriceUpdate();
