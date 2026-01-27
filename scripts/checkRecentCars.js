require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkRecentCars() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Get all cars created in last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const recentCars = await Car.find({
    createdAt: { $gte: tenMinutesAgo }
  }).sort({ createdAt: -1 });
  
  console.log(`\nCars created in last 10 minutes: ${recentCars.length}\n`);
  
  recentCars.forEach(car => {
    console.log(`- ${car._id}`);
    console.log(`  advertId: ${car.advertId || 'NONE'}`);
    console.log(`  ${car.make} ${car.model} ${car.year}`);
    console.log(`  Status: ${car.advertStatus}`);
    console.log(`  Dealer: ${car.dealerId || 'NONE'}`);
    console.log(`  isDealerListing: ${car.isDealerListing}`);
    console.log(`  Created: ${car.createdAt}`);
    console.log('');
  });
  
  // Also check total car count
  const totalCars = await Car.countDocuments();
  console.log(`Total cars in database: ${totalCars}`);
  
  await mongoose.disconnect();
}

checkRecentCars().catch(console.error);
