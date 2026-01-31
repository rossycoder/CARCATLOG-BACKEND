require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

async function updateCarLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all active cars without locationName
    const cars = await Car.find({ 
      advertStatus: 'active',
      postcode: { $exists: true, $ne: null },
      $or: [
        { locationName: { $exists: false } },
        { locationName: null },
        { locationName: '' }
      ]
    });

    console.log(`\n📊 Found ${cars.length} cars without location names\n`);

    let updated = 0;
    let failed = 0;

    for (const car of cars) {
      try {
        console.log(`\n🚗 Processing: ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log(`   Postcode: ${car.postcode}`);

        // Fetch location data
        const postcodeData = await postcodeService.lookupPostcode(car.postcode);
        
        // Update car
        car.locationName = postcodeData.locationName;
        
        // Update sellerContact.city if not set
        if (!car.sellerContact) {
          car.sellerContact = {};
        }
        if (!car.sellerContact.city) {
          car.sellerContact.city = postcodeData.locationName;
        }
        
        // Also update coordinates if missing
        if (!car.latitude || !car.longitude) {
          car.latitude = postcodeData.latitude;
          car.longitude = postcodeData.longitude;
          car.location = {
            type: 'Point',
            coordinates: [postcodeData.longitude, postcodeData.latitude]
          };
        }
        
        await car.save();
        
        console.log(`   ✅ Updated: ${car.locationName}`);
        updated++;
        
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Total: ${cars.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateCarLocations();
