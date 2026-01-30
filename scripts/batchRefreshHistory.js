require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryService = require('../services/historyService');

/**
 * Batch refresh history for all cars that don't have history yet
 * Run this after API limit resets (24 hours)
 */
async function batchRefreshHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars without history or with pending/failed status
    console.log('🔍 Finding cars without history...');
    const carsWithoutHistory = await Car.find({
      registrationNumber: { $exists: true, $ne: null },
      $or: [
        { historyCheckId: { $exists: false } },
        { historyCheckId: null },
        { historyCheckStatus: 'pending' },
        { historyCheckStatus: 'failed' }
      ]
    });

    console.log(`Found ${carsWithoutHistory.length} cars without history\n`);

    if (carsWithoutHistory.length === 0) {
      console.log('✅ All cars have history!');
      return;
    }

    const historyService = new HistoryService();
    let successCount = 0;
    let failCount = 0;
    let limitExceeded = false;

    for (let i = 0; i < carsWithoutHistory.length; i++) {
      const car = carsWithoutHistory[i];
      const vrm = car.registrationNumber;

      console.log(`\n[${i + 1}/${carsWithoutHistory.length}] Processing: ${vrm}`);
      console.log(`   Car ID: ${car._id}`);

      try {
        // Check if history already exists in database
        const existingHistory = await VehicleHistory.findOne({ vrm: vrm.toUpperCase() });
        
        if (existingHistory) {
          console.log(`   ✅ History already exists, linking to car...`);
          car.historyCheckId = existingHistory._id;
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = new Date();
          await car.save();
          successCount++;
          continue;
        }

        // Fetch fresh history from API
        console.log(`   📡 Fetching from API...`);
        const history = await historyService.checkVehicleHistory(vrm, true);

        // Update car
        car.historyCheckId = history._id;
        car.historyCheckStatus = 'verified';
        car.historyCheckDate = new Date();
        await car.save();

        console.log(`   ✅ Success! Owners: ${history.numberOfPreviousKeepers}`);
        successCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        
        // Check if daily limit exceeded
        if (error.isDailyLimitError || error.details?.status === 403 || error.message.includes('daily limit')) {
          console.log(`   ⏰ API daily limit exceeded!`);
          console.log(`   Stopping batch process...`);
          limitExceeded = true;
          break;
        }
        
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('BATCH REFRESH COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount} cars`);
    console.log(`❌ Failed: ${failCount} cars`);
    console.log(`⏳ Remaining: ${carsWithoutHistory.length - successCount - failCount} cars`);

    if (limitExceeded) {
      console.log('\n⚠️  API limit exceeded during batch process');
      console.log('   Run this script again after 24 hours to continue');
    } else if (failCount > 0) {
      console.log('\n⚠️  Some cars failed - check errors above');
    } else {
      console.log('\n🎉 All cars now have history!');
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

batchRefreshHistory();
