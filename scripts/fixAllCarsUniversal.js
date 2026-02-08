const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

async function fixAllCarsUniversal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    console.log('=== UNIVERSAL CAR DATA FIX ===');
    console.log('This will ensure ALL cars have complete data automatically\n');

    // Find all cars
    const allCars = await Car.find({});
    console.log(`Found ${allCars.length} cars in database\n`);

    const universalService = new UniversalAutoCompleteService();
    
    let fixed = 0;
    let alreadyComplete = 0;
    let failed = 0;

    for (let i = 0; i < allCars.length; i++) {
      const car = allCars[i];
      const progress = `[${i + 1}/${allCars.length}]`;
      
      try {
        console.log(`${progress} Processing: ${car.registrationNumber || car._id}`);
        
        // Check if needs completion
        if (universalService.needsCompletion(car)) {
          console.log(`   🔄 Needs completion - running universal service...`);
          
          await universalService.completeCarData(car, false); // Use cache if available
          
          console.log(`   ✅ Fixed successfully`);
          fixed++;
        } else {
          console.log(`   ✅ Already complete`);
          alreadyComplete++;
        }
        
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
      }
      
      // Add small delay to prevent API rate limiting
      if (i < allCars.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total cars: ${allCars.length}`);
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`✅ Already complete: ${alreadyComplete}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success rate: ${Math.round(((fixed + alreadyComplete) / allCars.length) * 100)}%`);

    if (fixed > 0) {
      console.log(`\n💰 Estimated API cost: £${(fixed * 1.89).toFixed(2)}`);
      console.log('(Actual cost may be lower due to caching)');
    }

    console.log('\n🎉 Universal car data fix complete!');
    console.log('All cars now have complete data automatically.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixAllCarsUniversal();