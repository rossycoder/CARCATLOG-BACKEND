require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findCar() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const advertId = '28cd7627-c8b1-42c2-99d8-3607d28f6974';
  
  console.log('Searching for advertId:', advertId);
  
  const car = await Car.findOne({ advertId });
  
  if (car) {
    console.log('\n✅ Car FOUND:');
    console.log('  _id:', car._id);
    console.log('  advertId:', car.advertId);
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Status:', car.advertStatus);
    console.log('  Dealer ID:', car.dealerId || 'NONE');
    console.log('  isDealerListing:', car.isDealerListing);
    console.log('  Created:', car.createdAt);
  } else {
    console.log('\n❌ Car NOT FOUND');
    
    // Check recent cars
    const recentCars = await Car.find().sort({ createdAt: -1 }).limit(5);
    console.log('\nMost recent 5 cars:');
    recentCars.forEach(c => {
      console.log(`  - ${c.advertId || c._id}: ${c.make} ${c.model} (dealer: ${c.dealerId || 'NONE'})`);
    });
  }
  
  await mongoose.disconnect();
}

findCar().catch(console.error);
