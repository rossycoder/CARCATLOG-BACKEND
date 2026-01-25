/**
 * Fix Missing Vehicle History Data
 * 
 * This script finds cars that don't have vehicle history data
 * and fetches it from the CheckCarDetails API
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

// Initialize history service
const historyService = new HistoryService();

async function fixMissingVehicleHistory() {
  try {
    console.log('🔍 Finding cars without vehicle history data...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all active cars without historyCheckId
    const carsWithoutHistory = await Car.find({
      advertStatus: 'active',
      registrationNumber: { $exists: true, $ne: null },
      $or: [
        { historyCheckId: { $exists: false } },
        { historyCheckId: null }
      ]
    }).select('_id make model registrationNumber year color createdAt');

    console.log(`Found ${carsWithoutHistory.length} cars without vehicle history data\n`);

    if (carsWithoutHistory.length === 0) {
      console.log('✓ All cars have vehicle history data!');
      process.exit(0);
    }

    // Process each car
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const car of carsWithoutHistory) {
      console.log(`\n📋 Processing: ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   ID: ${car._id}`);
      console.log(`   Created: ${car.createdAt.toLocaleDateString()}`);

      try {
        // Fetch vehicle history
        console.log(`   Fetching history data...`);
        const historyData = await historyService.checkVehicleHistory(car.registrationNumber, false);

        if (historyData && historyData._id) {
          // Update car with history check ID
          car.historyCheckId = historyData._id;
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = new Date();
          await car.save();

          console.log(`   ✓ History data saved`);
          console.log(`   - Write-off: ${historyData.isWrittenOff ? 'YES' : 'NO'}`);
          console.log(`   - Stolen: ${historyData.isStolen ? 'YES' : 'NO'}`);
          console.log(`   - Previous owners: ${historyData.previousOwners || 'Unknown'}`);
          
          successCount++;
        } else {
          console.log(`   ⚠️  No history data returned`);
          skippedCount++;
        }

      } catch (error) {
        console.log(`   ✗ Failed: ${error.message}`);
        failCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total processed: ${carsWithoutHistory.length}`);
    console.log(`   ✓ Success: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
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
fixMissingVehicleHistory();
