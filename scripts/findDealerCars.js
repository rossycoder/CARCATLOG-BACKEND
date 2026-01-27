require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findDealerCars() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const dealerId = '696ba3eed4c19da93bb917b5';
  
  console.log('Searching for dealer:', dealerId);
  
  const cars = await Car.find({ dealerId }).sort({ createdAt: -1 });
  
  console.log(`\nFound ${cars.length} cars for this dealer:\n`);
  
  cars.forEach(car => {
    console.log(`- ${car._id}`);
    console.log(`  advertId: ${car.advertId || 'NONE'}`);
    console.log(`  ${car.make} ${car.model} ${car.year}`);
    console.log(`  Status: ${car.advertStatus}`);
    console.log(`  Created: ${car.createdAt}`);
    console.log('');
  });
  
  // Also check for incomplete cars
  const incompleteCars = await Car.find({ 
    advertStatus: 'incomplete' 
  }).sort({ createdAt: -1 }).limit(10);
  
  console.log(`\nRecent incomplete cars (any dealer):`);
  incompleteCars.forEach(car => {
    console.log(`- ${car._id}: ${car.make} ${car.model} (advertId: ${car.advertId || 'NONE'}, dealer: ${car.dealerId || 'NONE'})`);
  });
  
  await mongoose.disconnect();
}

findDealerCars().catch(console.error);
