require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarLocationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a few recent cars to check their location data
    const cars = await Car.find({ advertStatus: 'active' })
      .limit(5)
      .sort({ createdAt: -1 })
      .select('make model registrationNumber locationName postcode sellerContact dealerId');

    console.log('\n📊 Recent Cars Location Data:\n');
    
    for (const car of cars) {
      console.log(`\n🚗 ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   Location Name: ${car.locationName || 'NOT SET'}`);
      console.log(`   Postcode: ${car.postcode || 'NOT SET'}`);
      console.log(`   Dealer ID: ${car.dealerId || 'NOT SET'}`);
      
      if (car.sellerContact) {
        console.log(`   Seller Type: ${car.sellerContact.type || 'NOT SET'}`);
        console.log(`   Business Name: ${car.sellerContact.businessName || 'NOT SET'}`);
        console.log(`   City: ${car.sellerContact.city || 'NOT SET'}`);
        console.log(`   Phone: ${car.sellerContact.phoneNumber || 'NOT SET'}`);
      } else {
        console.log(`   Seller Contact: NOT SET`);
      }
      
      console.log('   ---');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCarLocationData();
