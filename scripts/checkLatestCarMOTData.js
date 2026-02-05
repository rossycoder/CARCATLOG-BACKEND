/**
 * Check MOT data for the latest car in database
 * Verify that motDue, motExpiry, and motStatus are being saved correctly
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkLatestCarMOT() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the latest car (most recently created)
    const latestCar = await Car.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latestCar) {
      console.log('❌ No cars found in database');
      process.exit(1);
    }

    console.log('\n📋 Latest Car Details:');
    console.log(`   ID: ${latestCar._id}`);
    console.log(`   Registration: ${latestCar.registrationNumber}`);
    console.log(`   Make/Model: ${latestCar.make} ${latestCar.model}`);
    console.log(`   Created: ${latestCar.createdAt}`);
    console.log(`   Status: ${latestCar.advertStatus}`);

    console.log('\n🔍 MOT Data:');
    console.log(`   motDue: ${latestCar.motDue || 'NOT SET'}`);
    console.log(`   motExpiry: ${latestCar.motExpiry || 'NOT SET'}`);
    console.log(`   motStatus: ${latestCar.motStatus || 'NOT SET'}`);
    console.log(`   motHistory length: ${latestCar.motHistory?.length || 0}`);

    if (latestCar.motHistory && latestCar.motHistory.length > 0) {
      console.log('\n📊 Latest MOT Test:');
      const latestTest = latestCar.motHistory[0];
      console.log(`   Test Date: ${latestTest.testDate}`);
      console.log(`   Expiry Date: ${latestTest.expiryDate}`);
      console.log(`   Result: ${latestTest.testResult}`);
      console.log(`   Mileage: ${latestTest.odometerValue} ${latestTest.odometerUnit}`);
    }

    console.log('\n💰 Running Costs:');
    console.log(`   fuelEconomyCombined: ${latestCar.fuelEconomyCombined || 'NOT SET'}`);
    console.log(`   co2Emissions: ${latestCar.co2Emissions || 'NOT SET'}`);
    console.log(`   insuranceGroup: ${latestCar.insuranceGroup || 'NOT SET'}`);
    console.log(`   annualTax: ${latestCar.annualTax || 'NOT SET'}`);

    console.log('\n📸 Images:');
    console.log(`   Images count: ${latestCar.images?.length || 0}`);
    if (latestCar.images && latestCar.images.length > 0) {
      console.log(`   First image: ${latestCar.images[0].substring(0, 80)}...`);
    }

    console.log('\n👤 User:');
    console.log(`   userId: ${latestCar.userId || 'NOT SET'}`);

    // Check if data is complete
    const issues = [];
    if (!latestCar.motDue && !latestCar.motExpiry) issues.push('MOT Due/Expiry missing');
    if (!latestCar.fuelEconomyCombined) issues.push('Running costs missing');
    if (!latestCar.images || latestCar.images.length === 0) issues.push('No images');
    if (!latestCar.userId) issues.push('No userId');

    if (issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ All data looks good!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkLatestCarMOT();
