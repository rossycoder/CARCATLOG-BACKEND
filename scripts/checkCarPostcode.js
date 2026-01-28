require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarPostcode() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const car = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(0);
    }

    console.log('📝 Car Details:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Status: ${car.advertStatus}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Images: ${car.images.length}`);
    console.log(`\n📍 Location Details:`);
    console.log(`   Postcode (root): ${car.postcode || 'NOT SET'}`);
    console.log(`   Seller Contact Postcode: ${car.sellerContact?.postcode || 'NOT SET'}`);
    console.log(`   Location: ${car.location || 'NOT SET'}`);
    
    if (!car.postcode && !car.sellerContact?.postcode) {
      console.log('\n⚠️  WARNING: No postcode set! Car will not appear in postcode searches.');
      console.log('\n💡 Fixing postcode...');
      
      // Set postcode from your JSON data
      car.postcode = 'L1 1AA';
      if (!car.sellerContact) {
        car.sellerContact = {};
      }
      car.sellerContact.postcode = 'L1 1AA';
      
      await car.save();
      console.log('✅ Postcode updated to: L1 1AA');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCarPostcode();
