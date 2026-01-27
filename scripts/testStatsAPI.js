require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testStatsAPI() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const dealerId = '696ba3eed4c19da93bb917b5';
  
  console.log('Testing stats query for dealer:', dealerId);
  
  // Simulate the stats query
  const mostViewed = await Car.find({
    dealerId: mongoose.Types.ObjectId(dealerId),
    isDealerListing: true,
    advertStatus: 'active'
  })
    .sort({ viewCount: -1, createdAt: -1 })
    .limit(5)
    .select('make model year viewCount images price');
  
  console.log(`\nFound ${mostViewed.length} vehicles for Top Performing:\n`);
  
  mostViewed.forEach(vehicle => {
    console.log(`- ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    console.log(`  Price: £${vehicle.price || 0}`);
    console.log(`  Views: ${vehicle.viewCount || 0}`);
    console.log(`  Images: ${vehicle.images?.length || 0}`);
    console.log('');
  });
  
  await mongoose.disconnect();
}

testStatsAPI().catch(console.error);
