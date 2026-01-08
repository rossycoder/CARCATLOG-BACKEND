/**
 * Activate the specific BMW M3 car
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateSpecificBMW() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find the BMW M3 by advertId
    const advertId = '5233026e-0680-46ab-b268-412cfc63c51d';
    let car = await Car.findOne({ advertId });

    if (!car) {
      // Try finding by registration
      car = await Car.findOne({ registrationNumber: 'PO59 WRT' });
    }

    if (!car) {
      // Try finding by make/model/year
      car = await Car.findOne({ 
        make: 'BMW', 
        model: 'M3', 
        year: 2009,
        advertStatus: { $in: ['pending_payment', 'incomplete'] }
      });
    }

    if (!car) {
      console.log('❌ BMW M3 not found in database');
      console.log('\nSearching for ANY BMW M3...');
      const allBMWs = await Car.find({ make: 'BMW', model: 'M3' });
      console.log(`Found ${allBMWs.length} BMW M3 cars:`);
      allBMWs.forEach(c => {
        console.log(`   - ${c._id}: ${c.year} ${c.make} ${c.model} - Status: ${c.advertStatus}`);
      });
      await mongoose.connection.close();
      return;
    }

    console.log('🚗 Found BMW M3:');
    console.log(`   _id: ${car._id}`);
    console.log(`   Advert ID: ${car.advertId}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Current Status: ${car.advertStatus}`);
    console.log(`   Images: ${car.images.length}`);
    console.log(`   Package: ${car.advertisingPackage?.packageName || 'N/A'}`);

    if (car.advertStatus === 'active') {
      console.log('\n✅ Car is already active!');
    } else {
      console.log('\n🔄 Activating car...');
      car.advertStatus = 'active';
      car.publishedAt = car.publishedAt || new Date();
      await car.save();
      console.log('✅ BMW M3 ACTIVATED - Now visible in search results!');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateSpecificBMW();
