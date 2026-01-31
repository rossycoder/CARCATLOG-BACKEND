/**
 * Refresh vehicle history for all cars in database
 * This will fetch fresh data from API and update the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryService = require('../services/historyService');

async function refreshAllCarHistory() {
  try {
    console.log('🔄 Starting history refresh for all cars...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all cars with registration numbers
    const cars = await Car.find({ 
      registration: { $exists: true, $ne: null, $ne: '' } 
    }).select('registration make model _id');

    console.log(`Found ${cars.length} cars with registration numbers\n`);

    const historyService = new HistoryService();
    let successCount = 0;
    let errorCount = 0;

    // Process each car
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`[${i + 1}/${cars.length}] Processing ${car.registration} (${car.make} ${car.model})...`);

      try {
        // Force refresh (bypass cache)
        const historyData = await historyService.checkVehicleHistory(car.registration, true);
        
        console.log(`  ✅ History refreshed`);
        console.log(`     - Written off: ${historyData.isWrittenOff}`);
        console.log(`     - Category: ${historyData.writeOffCategory || 'none'}`);
        console.log(`     - Owners: ${historyData.numberOfPreviousKeepers || 0}`);
        
        successCount++;
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        errorCount++;
      }

      // Add small delay to avoid rate limiting
      if (i < cars.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total cars: ${cars.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
refreshAllCarHistory();
