require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testPriceEditFlow() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get advertId from command line or use a test one
    const advertId = process.argv[2];
    
    if (!advertId) {
      console.log('\n📋 Usage: node testPriceEditFlow.js <advertId> [newPrice]');
      console.log('Example: node testPriceEditFlow.js abc-123 18500');
      
      // List some recent adverts
      console.log('\n📝 Recent adverts:');
      const recentCars = await Car.find({ advertStatus: 'incomplete' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('advertId make model price createdAt');
      
      recentCars.forEach(car => {
        console.log(`  - ${car.advertId}: ${car.make} ${car.model} - £${car.price || 0}`);
      });
      
      process.exit(0);
    }
    
    console.log(`\n🔍 Testing price edit flow for: ${advertId}`);
    
    // Find the car
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Advert not found');
      process.exit(1);
    }
    
    console.log('\n📊 Current state:');
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Current Price:', `£${car.price || 0}`);
    console.log('  Status:', car.advertStatus);
    
    // Simulate price update (like the API would do)
    const newPrice = process.argv[3] ? parseFloat(process.argv[3]) : 18500;
    
    console.log(`\n💰 Simulating price update to: £${newPrice}`);
    
    // This mimics what the controller does
    const priceValue = parseFloat(newPrice);
    if (!isNaN(priceValue)) {
      car.price = priceValue;
      console.log(`  ✓ Price value parsed: £${priceValue}`);
    }
    
    await car.save();
    console.log('  ✓ Saved to database');
    
    // Verify the update
    const updatedCar = await Car.findOne({ advertId });
    console.log('\n✅ Verification:');
    console.log('  Price in database:', `£${updatedCar.price}`);
    console.log('  Type:', typeof updatedCar.price);
    
    if (updatedCar.price === priceValue) {
      console.log('\n🎉 SUCCESS: Price update working correctly!');
    } else {
      console.log('\n❌ FAILED: Price mismatch');
      console.log('  Expected:', priceValue);
      console.log('  Got:', updatedCar.price);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testPriceEditFlow();
