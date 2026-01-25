/**
 * Find Cars With History Data
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function findCarsWithHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find cars with historyCheckId
    const carsWithHistory = await Car.find({
      historyCheckId: { $exists: true, $ne: null }
    }).select('make model registrationNumber historyCheckId createdAt').limit(5);

    console.log(`Found ${carsWithHistory.length} cars with history data\n`);

    for (const car of carsWithHistory) {
      console.log(`📋 ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   ID: ${car._id}`);
      console.log(`   History Check ID: ${car.historyCheckId}`);
      
      const history = await VehicleHistory.findById(car.historyCheckId);
      if (history) {
        console.log(`   ✓ History data exists`);
        console.log(`   - Written Off: ${history.isWrittenOff ? 'YES' : 'NO'}`);
        console.log(`   - Has Accident History: ${history.hasAccidentHistory ? 'YES' : 'NO'}`);
      } else {
        console.log(`   ❌ History data not found`);
      }
      console.log('');
    }

    // Count total history records
    const totalHistory = await VehicleHistory.countDocuments();
    console.log(`\nTotal vehicle history records: ${totalHistory}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

findCarsWithHistory();
