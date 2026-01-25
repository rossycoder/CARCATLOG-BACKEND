/**
 * Fetch Missing History Data
 * 
 * This script fetches history data for cars that don't have it
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

const historyService = new HistoryService();

async function fetchMissingHistory() {
  try {
    console.log('🔍 Finding cars without valid history data...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find cars with invalid or missing history references
    const cars = await Car.find({
      advertStatus: 'active',
      registrationNumber: { $exists: true, $ne: null }
    }).select('_id make model registrationNumber historyCheckId');

    console.log(`Checking ${cars.length} cars...\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const car of cars) {
      console.log(`📋 ${car.make} ${car.model} (${car.registrationNumber})`);

      // Check if history exists
      if (car.historyCheckId) {
        const VehicleHistory = require('../models/VehicleHistory');
        const existingHistory = await VehicleHistory.findById(car.historyCheckId);
        if (existingHistory) {
          console.log(`   ✓ Already has valid history data`);
          skippedCount++;
          continue;
        }
      }

      try {
        console.log(`   Fetching history data...`);
        const historyData = await historyService.checkVehicleHistory(car.registrationNumber, false);

        if (historyData && historyData._id) {
          car.historyCheckId = historyData._id;
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = new Date();
          await car.save();

          console.log(`   ✅ History data saved`);
          console.log(`   - Written Off: ${historyData.isWrittenOff ? 'YES' : 'NO'}`);
          console.log(`   - Has Accident History: ${historyData.hasAccidentHistory ? 'YES' : 'NO'}`);
          if (historyData.accidentDetails) {
            console.log(`   - Accident Severity: ${historyData.accidentDetails.severity}`);
          }
          successCount++;
        } else {
          console.log(`   ⚠️  No history data returned`);
          failCount++;
        }

      } catch (error) {
        console.log(`   ✗ Failed: ${error.message}`);
        failCount++;
      }

      console.log('');
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total cars: ${cars.length}`);
    console.log(`   ✓ Already had history: ${skippedCount}`);
    console.log(`   ✅ Successfully fetched: ${successCount}`);
    console.log(`   ✗ Failed: ${failCount}`);
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
fetchMissingHistory();
