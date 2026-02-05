/**
 * Fix MOT data for the latest car
 * Extract from motHistory and save to motDue/motExpiry fields
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixLatestCarMOT() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the latest car
    const car = await Car.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!car) {
      console.log('❌ No cars found');
      process.exit(1);
    }

    console.log('\n📋 Car Details:');
    console.log(`   ID: ${car._id}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Created: ${car.createdAt}`);

    console.log('\n🔍 Current MOT Data:');
    console.log(`   motDue: ${car.motDue || 'NOT SET'}`);
    console.log(`   motExpiry: ${car.motExpiry || 'NOT SET'}`);
    console.log(`   motStatus: ${car.motStatus || 'NOT SET'}`);
    console.log(`   motHistory length: ${car.motHistory?.length || 0}`);

    if (!car.motHistory || car.motHistory.length === 0) {
      console.log('\n❌ No MOT history found - cannot fix');
      process.exit(1);
    }

    // Get latest MOT test
    const latestTest = car.motHistory[0];
    console.log('\n📊 Latest MOT Test:');
    console.log(`   Test Date: ${latestTest.testDate}`);
    console.log(`   Expiry Date: ${latestTest.expiryDate}`);
    console.log(`   Result: ${latestTest.testResult}`);

    if (!latestTest.expiryDate) {
      console.log('\n❌ No expiry date in latest test - cannot fix');
      process.exit(1);
    }

    // Update MOT fields
    car.motExpiry = latestTest.expiryDate;
    car.motDue = latestTest.expiryDate;

    // Determine MOT status
    const expiryDate = new Date(latestTest.expiryDate);
    const today = new Date();

    if (expiryDate > today) {
      car.motStatus = 'Valid';
    } else {
      car.motStatus = 'Expired';
    }

    await car.save();

    console.log('\n✅ MOT Data Fixed:');
    console.log(`   motDue: ${new Date(car.motDue).toLocaleDateString('en-GB')}`);
    console.log(`   motExpiry: ${new Date(car.motExpiry).toLocaleDateString('en-GB')}`);
    console.log(`   motStatus: ${car.motStatus}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixLatestCarMOT();
