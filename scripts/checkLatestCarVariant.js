require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkLatestCarVariant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the latest car
    const latestCar = await Car.findOne().sort({ createdAt: -1 });
    
    if (!latestCar) {
      console.log('❌ No cars found in database');
      return;
    }

    console.log('\n📋 Latest Car Details:');
    console.log(`   ID: ${latestCar._id}`);
    console.log(`   Registration: ${latestCar.registrationNumber}`);
    console.log(`   Make: ${latestCar.make}`);
    console.log(`   Model: ${latestCar.model}`);
    console.log(`   Variant: "${latestCar.variant}"`);
    console.log(`   Display Title: "${latestCar.displayTitle}"`);
    console.log(`   Engine Size: ${latestCar.engineSize}`);
    console.log(`   Fuel Type: ${latestCar.fuelType}`);
    console.log(`   Created: ${latestCar.createdAt}`);
    console.log(`   Updated: ${latestCar.updatedAt}`);

    // Check if variant is properly set
    if (!latestCar.variant || latestCar.variant === 'null' || latestCar.variant === 'undefined' || latestCar.variant.trim() === '') {
      console.log('\n⚠️  VARIANT ISSUE DETECTED!');
      console.log(`   Current variant value: "${latestCar.variant}"`);
      console.log(`   This should be automatically fixed by the Car model pre-save hook`);
    } else {
      console.log('\n✅ VARIANT IS PROPERLY SET');
      console.log(`   Variant: "${latestCar.variant}"`);
    }

    // Check history check status
    if (latestCar.historyCheckId) {
      console.log(`\n📊 History Check: Linked to ${latestCar.historyCheckId}`);
      console.log(`   Status: ${latestCar.historyCheckStatus}`);
      console.log(`   Date: ${latestCar.historyCheckDate}`);
    } else {
      console.log('\n⚠️  No history check linked');
    }

    // Get the last 5 cars to see variant pattern
    console.log('\n📋 Last 5 Cars Variant Check:');
    const recentCars = await Car.find().sort({ createdAt: -1 }).limit(5);
    
    recentCars.forEach((car, index) => {
      const variantStatus = (!car.variant || car.variant === 'null' || car.variant === 'undefined' || car.variant.trim() === '') 
        ? '❌ MISSING' 
        : '✅ SET';
      
      console.log(`   ${index + 1}. ${car.registrationNumber} - ${car.make} ${car.model}`);
      console.log(`      Variant: "${car.variant}" ${variantStatus}`);
      console.log(`      Display Title: "${car.displayTitle}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkLatestCarVariant();