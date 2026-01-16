require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

async function updateVehicleMakeModel() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars with "Unknown" make or model
    const carsToUpdate = await Car.find({
      $or: [
        { make: 'Unknown' },
        { model: 'Unknown' },
        { make: { $exists: false } },
        { model: { $exists: false } }
      ],
      registrationNumber: { $exists: true, $ne: null }
    });

    console.log(`Found ${carsToUpdate.length} vehicles with Unknown make/model\n`);

    if (carsToUpdate.length === 0) {
      console.log('No vehicles to update!');
      process.exit(0);
    }

    const historyService = new HistoryService();
    let updated = 0;
    let failed = 0;

    for (const car of carsToUpdate) {
      try {
        console.log(`\n📍 Updating: ${car.registrationNumber}`);
        
        // Fetch fresh data from API
        const historyData = await historyService.checkVehicleHistory(car.registrationNumber, false);
        
        // Update make and model
        if (historyData.make && historyData.make !== 'Unknown') {
          car.make = historyData.make;
        }
        if (historyData.model && historyData.model !== 'Unknown') {
          car.model = historyData.model;
        }
        
        await car.save();
        console.log(`✅ Updated: ${car.make} ${car.model}`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Failed to update ${car.registrationNumber}:`, error.message);
        failed++;
      }
    }


    console.log('\n============================================================');
    console.log(`✅ Updated: ${updated} vehicles`);
    console.log(`❌ Failed: ${failed} vehicles`);
    console.log('============================================================\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

updateVehicleMakeModel();
