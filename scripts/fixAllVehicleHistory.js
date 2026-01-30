/**
 * Fix vehicle history for all cars in production database
 * This script will:
 * 1. Find all cars with historyCheckId but missing history data
 * 2. Fetch fresh history from API for each car
 * 3. Update the database with correct history
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryService = require('../services/historyService');

async function fixAllVehicleHistory() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars with registration numbers
    console.log('Finding all cars with registration numbers...');
    const cars = await Car.find({ 
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    }).select('registrationNumber make model year advertStatus historyCheckId').lean();
    
    console.log(`Found ${cars.length} cars with registration numbers\n`);

    const historyService = new HistoryService();
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const car of cars) {
      const vrm = car.registrationNumber;
      console.log(`\n[${successCount + failCount + skippedCount + 1}/${cars.length}] Processing ${vrm} (${car.make} ${car.model} ${car.year})...`);

      try {
        // Check if history already exists
        const existingHistory = await VehicleHistory.findOne({ vrm: vrm }).lean();
        
        if (existingHistory && existingHistory.numberOfPreviousKeepers > 0) {
          console.log(`  ✓ History already exists with ${existingHistory.numberOfPreviousKeepers} owners - skipping`);
          skippedCount++;
          continue;
        }

        // Fetch history from API
        console.log(`  → Fetching history from API...`);
        const history = await historyService.checkVehicleHistory(vrm, true);
        
        console.log(`  ✓ History fetched successfully`);
        console.log(`    - Owners: ${history.numberOfPreviousKeepers}`);
        console.log(`    - V5C Certificates: ${history.v5cCertificateCount}`);
        console.log(`    - Keeper Changes: ${history.keeperChangesList?.length || 0}`);
        console.log(`    - Stolen: ${history.isStolen}`);
        console.log(`    - Finance: ${history.hasOutstandingFinance}`);
        console.log(`    - Written Off: ${history.isWrittenOff}`);
        
        // Update car's historyCheckId if needed
        if (car.historyCheckId?.toString() !== history._id?.toString()) {
          await Car.updateOne(
            { _id: car._id },
            { 
              historyCheckId: history._id,
              historyCheckStatus: 'verified',
              historyCheckDate: new Date()
            }
          );
          console.log(`  ✓ Updated car's historyCheckId`);
        }
        
        successCount++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`  ✗ Failed: ${error.message}`);
        
        // Check if it's a rate limit error
        if (error.message.includes('Daily API limit') || error.message.includes('403')) {
          console.log(`\n⚠️  API daily limit reached. Stopping here.`);
          console.log(`Processed: ${successCount} successful, ${failCount} failed, ${skippedCount} skipped`);
          break;
        }
        
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  ✓ Successful: ${successCount}`);
    console.log(`  ✗ Failed: ${failCount}`);
    console.log(`  → Skipped: ${skippedCount}`);
    console.log(`  Total: ${cars.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixAllVehicleHistory();
