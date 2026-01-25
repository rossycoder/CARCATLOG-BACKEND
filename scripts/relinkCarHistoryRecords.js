/**
 * Relink Car History Records
 * 
 * This script fixes cars that have invalid historyCheckId references
 * by linking them to the most recent history record for their VRM
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function relinkCarHistoryRecords() {
  try {
    console.log('🔍 Finding cars with invalid history references...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all active cars
    const cars = await Car.find({
      advertStatus: 'active',
      registrationNumber: { $exists: true, $ne: null }
    }).select('_id make model registrationNumber historyCheckId historyCheckStatus');

    console.log(`Found ${cars.length} active cars\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    for (const car of cars) {
      console.log(`📋 ${car.make} ${car.model} (${car.registrationNumber})`);

      // Check if current historyCheckId is valid
      let needsUpdate = false;
      if (car.historyCheckId) {
        const existingHistory = await VehicleHistory.findById(car.historyCheckId);
        if (!existingHistory) {
          console.log(`   ⚠️  Invalid history reference: ${car.historyCheckId}`);
          needsUpdate = true;
        } else {
          console.log(`   ✓ Valid history reference`);
          skippedCount++;
          continue;
        }
      } else {
        console.log(`   ⚠️  No history reference`);
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Find the most recent history record for this VRM
        const latestHistory = await VehicleHistory.findOne({
          vrm: car.registrationNumber.toUpperCase().replace(/\s/g, '')
        }).sort({ checkDate: -1 });

        if (latestHistory) {
          car.historyCheckId = latestHistory._id;
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = latestHistory.checkDate;
          await car.save();

          console.log(`   ✅ Linked to history record: ${latestHistory._id}`);
          console.log(`   - Written Off: ${latestHistory.isWrittenOff ? 'YES' : 'NO'}`);
          console.log(`   - Has Accident History: ${latestHistory.hasAccidentHistory ? 'YES' : 'NO'}`);
          if (latestHistory.accidentDetails) {
            console.log(`   - Accident Severity: ${latestHistory.accidentDetails.severity}`);
          }
          fixedCount++;
        } else {
          console.log(`   ❌ No history record found for ${car.registrationNumber}`);
          notFoundCount++;
        }
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total cars: ${cars.length}`);
    console.log(`   ✓ Already valid: ${skippedCount}`);
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   ❌ No history found: ${notFoundCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
relinkCarHistoryRecords();
