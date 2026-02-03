/**
 * Find vehicles with write-off categories in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function findWriteOffVehicles() {
  try {
    console.log('=== Finding Write-Off Vehicles ===\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find VehicleHistory documents with write-off categories
    console.log('🔍 Searching for write-off vehicles...\n');
    
    const writeOffVehicles = await VehicleHistory.find({
      writeOffCategory: { $exists: true, $ne: null, $ne: 'none', $ne: 'unknown' }
    }).select('vrm writeOffCategory writeOffDetails isWrittenOff');

    console.log(`Found ${writeOffVehicles.length} vehicles with write-off categories:\n`);

    for (const vehicle of writeOffVehicles) {
      console.log(`VRM: ${vehicle.vrm}`);
      console.log(`  Category: ${vehicle.writeOffCategory}`);
      console.log(`  Is Written Off: ${vehicle.isWrittenOff}`);
      if (vehicle.writeOffDetails) {
        console.log(`  Details: ${JSON.stringify(vehicle.writeOffDetails, null, 2)}`);
      }
      
      // Check if this vehicle has a corresponding Car document
      const car = await Car.findOne({ 
        registrationNumber: vehicle.vrm,
        historyCheckId: vehicle._id 
      });
      
      console.log(`  Car Document: ${car ? '✓ Found' : '❌ Not found'}`);
      if (car) {
        console.log(`    Car ID: ${car._id}`);
        console.log(`    Advert Status: ${car.advertStatus}`);
        console.log(`    MOT History: ${car.motHistory?.length || 0} tests`);
      }
      console.log('');
    }

    // Also check for vehicles with accident history
    console.log('\n🔍 Searching for vehicles with accident history...\n');
    
    const accidentVehicles = await VehicleHistory.find({
      $or: [
        { hasAccidentHistory: true },
        { isWrittenOff: true },
        { 'accidentDetails.count': { $gt: 0 } }
      ]
    }).select('vrm writeOffCategory hasAccidentHistory isWrittenOff accidentDetails');

    console.log(`Found ${accidentVehicles.length} vehicles with accident history:\n`);

    for (const vehicle of accidentVehicles) {
      console.log(`VRM: ${vehicle.vrm}`);
      console.log(`  Write-off Category: ${vehicle.writeOffCategory || 'none'}`);
      console.log(`  Has Accident History: ${vehicle.hasAccidentHistory}`);
      console.log(`  Is Written Off: ${vehicle.isWrittenOff}`);
      if (vehicle.accidentDetails) {
        console.log(`  Accident Details: ${JSON.stringify(vehicle.accidentDetails, null, 2)}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

findWriteOffVehicles();