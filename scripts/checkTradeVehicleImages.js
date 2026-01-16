require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkTradeVehicleImages() {
  try {
    const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!dbUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Find trade dealer vehicles
    const tradeCars = await Car.find({ 
      isDealerListing: true 
    }).select('_id advertId make model images isDealerListing advertStatus').limit(5);

    console.log(`Found ${tradeCars.length} trade dealer vehicles\n`);

    tradeCars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   ID: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Images: ${car.images ? car.images.length : 0}`);
      if (car.images && car.images.length > 0) {
        console.log(`   First image: ${car.images[0].substring(0, 80)}...`);
      } else {
        console.log(`   ⚠️  NO IMAGES!`);
      }
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTradeVehicleImages();
