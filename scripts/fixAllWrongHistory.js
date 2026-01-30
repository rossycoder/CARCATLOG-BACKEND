require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

/**
 * Fix all wrong history records that were saved by enhanced-vehicle-service
 * These records have 0 owners and wrong data
 */
async function fixAllWrongHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(60));
    console.log('FIX ALL WRONG HISTORY RECORDS');
    console.log('='.repeat(60));
    
    // Find all wrong history records
    console.log('\n📋 Finding wrong history records...');
    console.log('Criteria:');
    console.log('  - apiProvider = "enhanced-vehicle-service"');
    console.log('  - OR numberOfPreviousKeepers = 0');
    console.log('  - OR apiProvider != "CheckCarDetails"\n');
    
    const wrongRecords = await VehicleHistory.find({
      $or: [
        { apiProvider: 'enhanced-vehicle-service' },
        { apiProvider: { $ne: 'CheckCarDetails' } },
        { numberOfPreviousKeepers: 0, apiProvider: { $ne: 'CheckCarDetails' } }
      ]
    });

    console.log(`Found ${wrongRecords.length} wrong records\n`);

    if (wrongRecords.length === 0) {
      console.log('✅ No wrong records found! All history is correct.');
      return;
    }

    // Show list
    console.log('Wrong records:');
    wrongRecords.forEach((record, i) => {
      console.log(`  ${i + 1}. ${record.vrm} - Provider: ${record.apiProvider}, Owners: ${record.numberOfPreviousKeepers}`);
    });

    console.log('\n⚠️  These records will be deleted and re-fetched from API');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    const historyService = new HistoryService();
    let successCount = 0;
    let failCount = 0;
    let limitExceeded = false;

    for (let i = 0; i < wrongRecords.length; i++) {
      const record = wrongRecords[i];
      const vrm = record.vrm;

      console.log(`\n[${i + 1}/${wrongRecords.length}] Processing: ${vrm}`);

      try {
        // Delete old wrong record
        await VehicleHistory.deleteOne({ _id: record._id });
        console.log(`   🗑️  Deleted old record`);

        // Fetch fresh from API
        console.log(`   📡 Fetching fresh data...`);
        const freshHistory = await historyService.checkVehicleHistory(vrm, true);

        console.log(`   ✅ Success!`);
        console.log(`      Owners: ${freshHistory.numberOfPreviousKeepers}`);
        console.log(`      Provider: ${freshHistory.apiProvider}`);

        // Update all cars with this VRM
        const cars = await Car.find({ registrationNumber: vrm });
        for (const car of cars) {
          car.historyCheckId = freshHistory._id;
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = new Date();
          await car.save();
        }
        console.log(`   🚗 Updated ${cars.length} car(s)`);

        successCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        
        // Check if daily limit exceeded
        if (error.isDailyLimitError || error.details?.status === 403 || error.message.includes('daily limit')) {
          console.log(`   ⏰ API daily limit exceeded!`);
          console.log(`   Stopping process...`);
          limitExceeded = true;
          break;
        }
        
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('FIX COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Fixed: ${successCount} records`);
    console.log(`❌ Failed: ${failCount} records`);
    console.log(`⏳ Remaining: ${wrongRecords.length - successCount - failCount} records`);

    if (limitExceeded) {
      console.log('\n⚠️  API limit exceeded during process');
      console.log('   Run this script again after 24 hours to continue');
    } else if (failCount > 0) {
      console.log('\n⚠️  Some records failed - check errors above');
    } else {
      console.log('\n🎉 All wrong records fixed!');
      console.log('   Frontend will now show correct data');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixAllWrongHistory();
