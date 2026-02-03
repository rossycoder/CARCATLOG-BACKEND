const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixHistoryReferences() {
  try {
    console.log('🔧 Fixing Vehicle History References...');
    console.log('=' .repeat(50));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find cars without historyCheckId but have registration numbers
    const carsWithoutHistory = await Car.find({
      registrationNumber: { $exists: true, $ne: null },
      historyCheckId: { $exists: false }
    });

    console.log(`Found ${carsWithoutHistory.length} cars without history references`);

    let fixedCount = 0;

    for (const car of carsWithoutHistory) {
      console.log(`\n🔍 Processing: ${car.registrationNumber}`);
      
      // Find matching VehicleHistory document
      const history = await VehicleHistory.findOne({ 
        vrm: car.registrationNumber.toUpperCase() 
      });

      if (history) {
        console.log(`  ✅ Found history document: ${history._id}`);
        
        // Update car with history reference
        await Car.findByIdAndUpdate(car._id, {
          historyCheckId: history._id,
          historyCheckStatus: 'verified',
          historyCheckDate: history.checkDate || new Date()
        });

        console.log(`  ✅ Updated car with history reference`);
        fixedCount++;
      } else {
        console.log(`  ⚠️  No history document found for ${car.registrationNumber}`);
      }
    }

    // Now test the populate functionality
    console.log(`\n📋 Testing populate after fixes...`);
    const testCar = await Car.findOne({ 
      historyCheckId: { $exists: true, $ne: null } 
    }).populate('historyCheckId');

    if (testCar && testCar.historyCheckId) {
      console.log(`✅ Populate working! Car: ${testCar.registrationNumber}`);
      console.log(`   History VRM: ${testCar.historyCheckId.vrm}`);
      console.log(`   Previous keepers: ${testCar.historyCheckId.numberOfPreviousKeepers || 0}`);
      console.log(`   MOT Status: ${testCar.historyCheckId.motStatus || 'Not set'}`);
    } else {
      console.log(`❌ Populate still not working`);
    }

    console.log(`\n🎉 Fixed ${fixedCount} car history references`);

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the fix
fixHistoryReferences();