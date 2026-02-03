require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkSpecificCarVariant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check the specific car from the screenshot URL
    const carId = '6980e63af1587234425505f2';
    
    console.log(`\n🔍 Checking specific car: ${carId}`);
    
    const car = await Car.findById(carId).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('\n📋 Car Details from Database:');
    console.log(`   ID: ${car._id}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make: ${car.make}`);
    console.log(`   Model: ${car.model}`);
    console.log(`   Variant: "${car.variant}"`);
    console.log(`   Display Title: "${car.displayTitle}"`);
    console.log(`   Engine Size: ${car.engineSize}L`);
    console.log(`   Fuel Type: ${car.fuelType}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Price: £${car.price}`);

    // Check variant status
    if (car.variant && car.variant !== 'null' && car.variant !== 'undefined' && car.variant.trim() !== '') {
      console.log('\n✅ VARIANT STATUS: PROPERLY SET');
      console.log(`   Database Value: "${car.variant}"`);
      console.log(`   Frontend Display: "${car.displayTitle}"`);
    } else {
      console.log('\n❌ VARIANT STATUS: MISSING OR INVALID');
      console.log(`   Database Value: "${car.variant}"`);
    }

    // Check vehicle history
    if (car.historyCheckId) {
      console.log('\n📊 Vehicle History:');
      console.log(`   History ID: ${car.historyCheckId._id}`);
      console.log(`   Write-off Category: ${car.historyCheckId.writeOffCategory || 'none'}`);
      console.log(`   Status: ${car.historyCheckStatus}`);
      
      // Check if write-off badge should show
      const writeOffCategory = car.historyCheckId.writeOffCategory;
      const shouldShowBadge = writeOffCategory && ['A', 'B', 'S', 'N'].includes(writeOffCategory.toUpperCase());
      
      if (shouldShowBadge) {
        console.log(`\n🔴 WRITE-OFF BADGE: WILL SHOW`);
        console.log(`   Badge Text: "⚠️ CAT ${writeOffCategory.toUpperCase()}"`);
        console.log(`   Color: Red`);
      } else {
        console.log(`\n✅ WRITE-OFF BADGE: NOT SHOWN (Clean vehicle)`);
      }
    } else {
      console.log('\n⚠️  No vehicle history linked');
    }

    console.log('\n🎯 Frontend Display Summary:');
    console.log(`   URL: localhost:3000/cars/${car._id}`);
    console.log(`   Title: ${car.make} ${car.model}`);
    console.log(`   Subtitle: ${car.displayTitle}`);
    console.log(`   Price: £${car.price.toLocaleString()}`);
    console.log(`   Variant in DB: "${car.variant}" ✅`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkSpecificCarVariant();