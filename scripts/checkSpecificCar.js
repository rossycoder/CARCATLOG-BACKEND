/**
 * Check the specific car from the user's example
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkSpecificCar() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find the specific car by advertId
    const advertId = '2e8562cf-3111-415c-ac91-80bc037f5857';
    const car = await Car.findOne({ advertId });

    if (!car) {
      console.log('❌ Car not found');
      await mongoose.connection.close();
      return;
    }

    console.log('🚗 Car found:');
    console.log('   _id:', car._id);
    console.log('   advertId:', car.advertId);
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Year:', car.year);
    console.log('   Price:', car.price);
    console.log('   Status:', car.advertStatus);
    console.log('   Images:', car.images.length);
    console.log('   Contact Email:', car.sellerContact?.email);
    console.log('   Contact Phone:', car.sellerContact?.phoneNumber);
    console.log('   Postcode:', car.postcode);
    console.log('   Advertising Package:', car.advertisingPackage);
    console.log('\n');

    // Check if it should be activated
    const hasImages = car.images && car.images.length > 0;
    const hasContact = car.sellerContact && car.sellerContact.email && car.sellerContact.phoneNumber;
    const hasPrice = car.price && car.price > 0;

    console.log('📋 Activation Check:');
    console.log('   Has images:', hasImages, `(${car.images?.length || 0})`);
    console.log('   Has contact:', hasContact);
    console.log('   Has price:', hasPrice);
    console.log('   Has package:', !!car.advertisingPackage);

    if (hasImages && hasContact && hasPrice && car.advertStatus === 'incomplete') {
      console.log('\n✅ This car SHOULD be activated!');
      console.log('   Activating now...');
      
      car.advertStatus = 'active';
      car.publishedAt = car.publishedAt || new Date();
      await car.save();
      
      console.log('   ✅ Car activated successfully!');
    } else if (car.advertStatus === 'active') {
      console.log('\n✅ Car is already active');
    } else {
      console.log('\n⚠️  Car cannot be activated yet:');
      if (!hasImages) console.log('      - Missing images');
      if (!hasContact) console.log('      - Missing contact details');
      if (!hasPrice) console.log('      - Missing price');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSpecificCar();
