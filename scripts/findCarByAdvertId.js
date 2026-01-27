require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findCar() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const advertId = '314332f1-0a6e-4aa6-a280-6eb91e369807';
  
  console.log('Searching for advertId:', advertId);
  
  const carByAdvertId = await Car.findOne({ advertId });
  console.log('Found by advertId:', carByAdvertId ? carByAdvertId._id : 'NOT FOUND');
  
  // Also search for recent trade dealer cars
  const tradeCars = await Car.find({ isDealerListing: true }).sort({ createdAt: -1 }).limit(5);
  
  console.log('\nRecent trade dealer cars:');
  tradeCars.forEach(car => {
    console.log(`- ${car._id}: ${car.make} ${car.model} (advertId: ${car.advertId || 'NONE'})`);
  });
  
  await mongoose.disconnect();
}

findCar().catch(console.error);
