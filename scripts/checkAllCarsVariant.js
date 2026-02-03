require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAllCarsVariant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all cars
    const allCars = await Car.find().sort({ createdAt: -1 });
    
    if (allCars.length === 0) {
      console.log('❌ No cars found in database');
      return;
    }

    console.log(`\n📋 Found ${allCars.length} cars in database`);
    console.log('\n📊 Variant Status for All Cars:');

    let variantSetCount = 0;
    let variantMissingCount = 0;

    allCars.forEach((car, index) => {
      const hasVariant = car.variant && 
                        car.variant !== 'null' && 
                        car.variant !== 'undefined' && 
                        car.variant.trim() !== '';
      
      if (hasVariant) {
        variantSetCount++;
      } else {
        variantMissingCount++;
      }

      const variantStatus = hasVariant ? '✅ SET' : '❌ MISSING';
      
      console.log(`   ${index + 1}. ${car.registrationNumber || 'NO-REG'} - ${car.make} ${car.model}`);
      console.log(`      Variant: "${car.variant}" ${variantStatus}`);
      console.log(`      Display Title: "${car.displayTitle}"`);
      console.log(`      Engine Size: ${car.engineSize}L`);
      console.log(`      Fuel Type: ${car.fuelType}`);
      console.log(`      Created: ${car.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    console.log('\n📊 Summary:');
    console.log(`   Total Cars: ${allCars.length}`);
    console.log(`   Variants Set: ${variantSetCount} ✅`);
    console.log(`   Variants Missing: ${variantMissingCount} ${variantMissingCount > 0 ? '❌' : '✅'}`);
    
    if (variantMissingCount > 0) {
      console.log('\n⚠️  Some cars have missing variants. This should be automatically fixed when they are next saved.');
    } else {
      console.log('\n✅ All cars have variants properly set!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAllCarsVariant();