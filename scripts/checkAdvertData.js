require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAdvertData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the advert ID from command line or use a default
    const advertId = process.argv[2] || '3655c431-391a-4081-ac9b-b323bded03d5';
    
    console.log(`\n🔍 Checking advert: ${advertId}\n`);
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Advert not found');
      process.exit(1);
    }
    
    console.log('📋 Car Data:');
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Registration:', car.registrationNumber);
    console.log('  Price:', car.price);
    console.log('  Estimated Value:', car.estimatedValue);
    console.log('  MOT Due:', car.motDue);
    console.log('  MOT Expiry:', car.motExpiry);
    console.log('  MOT Status:', car.motStatus);
    console.log('  Tax Status:', car.taxStatus);
    console.log('  Status:', car.advertStatus);
    
    console.log('\n💰 Price Analysis:');
    console.log('  car.price type:', typeof car.price);
    console.log('  car.price value:', car.price);
    console.log('  car.price === 0:', car.price === 0);
    console.log('  !car.price:', !car.price);
    console.log('  car.price || "fallback":', car.price || 'fallback');
    
    console.log('\n🔧 MOT Analysis:');
    console.log('  car.motDue:', car.motDue);
    console.log('  car.motExpiry:', car.motExpiry);
    console.log('  car.motStatus:', car.motStatus);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdvertData();
