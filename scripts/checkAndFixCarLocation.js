/**
 * Check and fix car location data
 * This script checks the car's location data and fixes it if needed
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

const REGISTRATION = 'EK11XHZ';

async function checkAndFixCarLocation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car
    const car = await Car.findOne({ registrationNumber: REGISTRATION });
    
    if (!car) {
      console.error('❌ Car not found with registration:', REGISTRATION);
      return;
    }

    console.log('\n🚗 Car Details:');
    console.log('   ID:', car._id);
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Postcode:', car.postcode);
    console.log('   Location Name:', car.locationName || 'NOT SET');
    console.log('   Latitude:', car.latitude || 'NOT SET');
    console.log('   Longitude:', car.longitude || 'NOT SET');
    console.log('   Location Object:', car.location || 'NOT SET');

    // If location data is missing, fetch it
    if (!car.locationName || !car.latitude || !car.longitude) {
      console.log('\n📍 Location data missing, fetching from postcode...');
      
      if (!car.postcode) {
        console.error('❌ No postcode available to fetch location');
        return;
      }

      try {
        const postcodeData = await postcodeService.lookupPostcode(car.postcode);
        
        console.log('\n✅ Postcode lookup successful:');
        console.log('   Location Name:', postcodeData.locationName);
        console.log('   Latitude:', postcodeData.latitude);
        console.log('   Longitude:', postcodeData.longitude);
        
        // Update car with location data
        car.locationName = postcodeData.locationName;
        car.latitude = postcodeData.latitude;
        car.longitude = postcodeData.longitude;
        car.location = {
          type: 'Point',
          coordinates: [postcodeData.longitude, postcodeData.latitude]
        };
        
        await car.save();
        
        console.log('\n✅ Car location updated successfully!');
        console.log('   New Location Name:', car.locationName);
        console.log('   New Coordinates:', car.latitude, car.longitude);
        
      } catch (error) {
        console.error('❌ Error fetching postcode data:', error.message);
      }
    } else {
      console.log('\n✅ Location data already exists');
    }

    console.log('\n📝 Final Car Location Data:');
    console.log('   Postcode:', car.postcode);
    console.log('   Location Name:', car.locationName);
    console.log('   Coordinates:', car.latitude, car.longitude);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAndFixCarLocation();
