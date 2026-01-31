const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function fixCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'EK11XHZ';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log('🚗 Found car:', car.make, car.model);
    console.log('Current status:', car.advertStatus);
    console.log('Current images:', car.images?.length || 0);
    console.log('Current userId:', car.userId || 'NOT SET');
    console.log('Current postcode:', car.postcode || 'NOT SET');
    
    let updated = false;
    
    // Fix 1: Ensure userId is set (use the one from sellerContact if available)
    if (!car.userId) {
      console.log('\n⚠️  No userId found!');
      console.log('Please provide a userId to assign this car to a user.');
      console.log('You can find user IDs by running: node backend/scripts/findRecentUsers.js');
      // Don't auto-fix this - needs manual intervention
    }
    
    // Fix 2: Add postcode if missing
    if (!car.postcode && car.sellerContact?.postcode) {
      car.postcode = car.sellerContact.postcode;
      updated = true;
      console.log('✅ Added postcode from sellerContact');
    } else if (!car.postcode) {
      console.log('\n⚠️  No postcode found!');
      console.log('Car needs a postcode to show in location-based searches.');
    }
    
    // Fix 3: Add coordinates if missing but postcode exists
    if (car.postcode && (!car.latitude || !car.longitude)) {
      console.log('\n⚠️  Postcode exists but no coordinates!');
      console.log('Run: node backend/scripts/addCoordinatesToCar.js to fix this');
    }
    
    // Fix 4: Check images
    if (!car.images || car.images.length === 0) {
      console.log('\n❌ CRITICAL: No images!');
      console.log('Cars without images may not show prominently in search results.');
      console.log('Please upload photos for this car.');
    }
    
    // Fix 5: Add description if empty
    if (!car.description || car.description.trim() === '') {
      car.description = `${car.year} ${car.make} ${car.model} ${car.variant || ''} in ${car.color || 'good'} condition. ${car.mileage?.toLocaleString()} miles. ${car.transmission} transmission, ${car.fuelType} fuel type.`.trim();
      updated = true;
      console.log('✅ Added auto-generated description');
    }
    
    // Fix 6: Ensure publishedAt is set if status is active
    if (car.advertStatus === 'active' && !car.publishedAt) {
      car.publishedAt = new Date();
      updated = true;
      console.log('✅ Added publishedAt date');
    }
    
    // Fix 7: Ensure sellerContact.type is set
    if (!car.sellerContact?.type) {
      if (!car.sellerContact) car.sellerContact = {};
      car.sellerContact.type = 'private';
      updated = true;
      console.log('✅ Set sellerContact.type to private');
    }
    
    if (updated) {
      await car.save();
      console.log('\n✅ Car updated successfully!');
    } else {
      console.log('\n⚠️  No automatic fixes applied.');
    }
    
    console.log('\n=====================================');
    console.log('SUMMARY:');
    console.log('=====================================');
    console.log(`Status: ${car.advertStatus}`);
    console.log(`Published: ${car.publishedAt ? '✅' : '❌'}`);
    console.log(`User ID: ${car.userId ? '✅' : '❌ MISSING'}`);
    console.log(`Postcode: ${car.postcode ? '✅' : '❌ MISSING'}`);
    console.log(`Coordinates: ${car.latitude && car.longitude ? '✅' : '❌ MISSING'}`);
    console.log(`Images: ${car.images?.length || 0} ${car.images?.length > 0 ? '✅' : '❌ MISSING'}`);
    console.log(`Description: ${car.description ? '✅' : '❌ MISSING'}`);
    
    console.log('\n🔍 TO MAKE THIS CAR VISIBLE:');
    if (!car.userId) console.log('1. ❌ Assign a userId');
    if (!car.postcode) console.log('2. ❌ Add a postcode');
    if (!car.latitude || !car.longitude) console.log('3. ❌ Add coordinates');
    if (!car.images || car.images.length === 0) console.log('4. ❌ Upload at least 1 photo');
    
    if (car.userId && car.postcode && car.latitude && car.longitude && car.images?.length > 0) {
      console.log('✅ All requirements met! Car should be visible.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixCar();
