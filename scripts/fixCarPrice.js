require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixCarPrice() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const advertId = process.argv[2];
    const newPrice = process.argv[3];
    
    if (!advertId || !newPrice) {
      console.log('\n❌ Missing arguments');
      console.log('Usage: node fixCarPrice.js <advertId> <newPrice>');
      console.log('Example: node fixCarPrice.js abc-123 16670');
      process.exit(1);
    }
    
    console.log(`\n🔍 Looking for advert: ${advertId}`);
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    console.log('\n📊 Current data:');
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Current Price:', `£${car.price || 0}`);
    console.log('  Registration:', car.registrationNumber || 'N/A');
    
    const priceValue = parseFloat(newPrice);
    
    if (isNaN(priceValue) || priceValue <= 0) {
      console.log('\n❌ Invalid price value');
      process.exit(1);
    }
    
    console.log(`\n💰 Updating price to: £${priceValue}`);
    
    car.price = priceValue;
    await car.save();
    
    console.log('✅ Price updated successfully!');
    
    // Verify
    const updated = await Car.findOne({ advertId });
    console.log('\n✅ Verified:');
    console.log('  New Price:', `£${updated.price}`);
    console.log('  Type:', typeof updated.price);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixCarPrice();
