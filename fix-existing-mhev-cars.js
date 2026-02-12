require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

/**
 * Fix existing MHEV cars that have wrong fuel type
 * This script checks VehicleHistory for DVLA data and updates Cars accordingly
 */
async function fixExistingMHEVCars() {
  try {
    console.log('🔧 Fixing Existing MHEV Cars\n');
    console.log('='.repeat(70));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find all cars with historyCheckId
    const cars = await Car.find({ 
      historyCheckId: { $exists: true, $ne: null },
      fuelType: { $in: ['Diesel', 'Petrol'] } // Only pure Diesel or Petrol
    });
    
    console.log(`📊 Found ${cars.length} cars with history data and pure fuel types\n`);
    
    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const car of cars) {
      try {
        // Get VehicleHistory
        const history = await VehicleHistory.findById(car.historyCheckId);
        
        if (!history) {
          console.log(`⚠️  ${car.registrationNumber}: No history found`);
          skipped++;
          continue;
        }
        
        // Check if DVLA indicates hybrid
        const dvlaFuelType = history.fuelType || '';
        const dvlaLower = dvlaFuelType.toLowerCase();
        
        // Check if this is an MHEV case
        const shouldBeHybrid = (
          (car.fuelType === 'Diesel' && dvlaLower.includes('hybrid')) ||
          (car.fuelType === 'Petrol' && dvlaLower.includes('hybrid'))
        );
        
        if (shouldBeHybrid) {
          const newFuelType = car.fuelType === 'Diesel' ? 'Diesel Hybrid' : 'Petrol Hybrid';
          
          console.log(`\n🔄 ${car.registrationNumber} (${car.make} ${car.model})`);
          console.log(`   Current: ${car.fuelType}`);
          console.log(`   DVLA: ${dvlaFuelType}`);
          console.log(`   New: ${newFuelType}`);
          
          // Update car
          car.fuelType = newFuelType;
          await car.save();
          
          // Also update VehicleHistory for consistency
          history.fuelType = newFuelType;
          await history.save();
          
          console.log(`   ✅ Updated successfully`);
          fixed++;
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${car.registrationNumber}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed} cars`);
    console.log(`   ⏭️  Skipped: ${skipped} cars`);
    console.log(`   ❌ Errors: ${errors} cars`);
    
    if (fixed > 0) {
      console.log('\n✅ All MHEV cars have been updated!');
    } else {
      console.log('\n✅ No MHEV cars needed updating');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

fixExistingMHEVCars();
