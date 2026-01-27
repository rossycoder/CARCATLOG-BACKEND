require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkDealerCarPrices() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find all dealer cars
  const cars = await Car.find({ 
    isDealerListing: true 
  }).sort({ createdAt: -1 }).limit(20);
  
  console.log(`\nFound ${cars.length} dealer cars:\n`);
  
  cars.forEach(car => {
    console.log(`- ${car._id}`);
    console.log(`  ${car.year} ${car.make} ${car.model}`);
    console.log(`  Price: £${car.price || 0} (type: ${typeof car.price})`);
    console.log(`  Status: ${car.advertStatus}`);
    console.log(`  Views: ${car.viewCount || 0}`);
    console.log(`  Dealer: ${car.dealerId}`);
    console.log('');
  });
  
  await mongoose.disconnect();
}

checkDealerCarPrices().catch(console.error);
