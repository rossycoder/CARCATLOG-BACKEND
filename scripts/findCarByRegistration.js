require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findCarByRegistration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const vrm = process.argv[2];
    
    if (!vrm) {
      console.log('❌ Please provide a registration number');
      console.log('Usage: node findCarByRegistration.js NU10YEV');
      process.exit(1);
    }
    
    console.log(`🔍 Searching for registration: ${vrm.toUpperCase()}\n`);
    
    const car = await Car.findOne({ 
      registrationNumber: vrm.toUpperCase() 
    });
    
    if (!car) {
      console.log('❌ Car not found in database');
      process.exit(0);
    }
    
    console.log('✅ Car found!\n');
    console.log('📝 Car Details:');
    console.log(`   MongoDB ID: ${car._id}`);
    console.log(`   Advert ID: ${car.advertId}`);
    console.log(`   Status: ${car.advertStatus}`);
    console.log(`   Make/Model: ${car.make} ${car.model} ${car.variant || ''}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Mileage: ${car.mileage}`);
    console.log(`   Images: ${car.images.length}`);
    console.log(`\n📍 Location:`);
    console.log(`   Postcode: ${car.postcode || 'NOT SET'}`);
    console.log(`   Coordinates: ${car.latitude && car.longitude ? `${car.latitude}, ${car.longitude}` : 'NOT SET'}`);
    console.log(`\n👤 User:`);
    console.log(`   User ID: ${car.userId || 'NOT SET'}`);
    console.log(`   Seller Email: ${car.sellerContact?.email || 'NOT SET'}`);
    console.log(`\n📋 History:`);
    console.log(`   History Status: ${car.historyCheckStatus}`);
    console.log(`   History ID: ${car.historyCheckId || 'NOT SET'}`);
    console.log(`\n📅 Dates:`);
    console.log(`   Created: ${car.createdAt}`);
    console.log(`   Published: ${car.publishedAt || 'NOT PUBLISHED'}`);
    
    // Check what's missing
    const missing = [];
    if (!car.latitude || !car.longitude) missing.push('Coordinates');
    if (!car.userId) missing.push('User ID');
    if (!car.historyCheckId) missing.push('Vehicle History');
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing Data: ${missing.join(', ')}`);
      console.log('\n💡 Run this to fix:');
      console.log('   node backend/scripts/fixAllCarsAutomatically.js');
    } else {
      console.log('\n✅ All data complete!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findCarByRegistration();
