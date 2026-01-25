require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function diagnoseDeploymentHistoryIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the most recently added cars
    const recentCars = await Car.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('registration make model displayTitle createdAt vehicleHistory');

    console.log('\n=== RECENT CARS ===');
    for (const car of recentCars) {
      console.log(`\nCar: ${car.displayTitle || `${car.make} ${car.model}`}`);
      console.log(`Registration: ${car.registration}`);
      console.log(`Created: ${car.createdAt}`);
      console.log(`Vehicle History ID: ${car.vehicleHistory}`);

      if (car.vehicleHistory) {
        const history = await VehicleHistory.findById(car.vehicleHistory);
        if (history) {
          console.log('\n--- History Data ---');
          console.log(`Written Off: ${history.writtenOff}`);
          console.log(`Stolen: ${history.stolen}`);
          console.log(`Scrapped: ${history.scrapped}`);
          console.log(`Imported: ${history.imported}`);
          console.log(`Exported: ${history.exported}`);
          console.log(`Previous Owners: ${history.previousOwners}`);
          console.log(`Colour Changes: ${history.colourChanges}`);
          console.log(`Plate Changes: ${history.plateChanges}`);
          console.log(`MOT Expiry: ${history.motExpiry}`);
          console.log(`Last Updated: ${history.lastUpdated}`);
        } else {
          console.log('❌ Vehicle History record not found in database!');
        }
      } else {
        console.log('❌ No vehicle history linked to this car!');
      }
    }

    // Check if there are any orphaned vehicle history records
    const allHistoryRecords = await VehicleHistory.find().sort({ lastUpdated: -1 }).limit(10);
    console.log('\n\n=== RECENT VEHICLE HISTORY RECORDS ===');
    for (const history of allHistoryRecords) {
      console.log(`\nVRM: ${history.vrm}`);
      console.log(`Written Off: ${history.writtenOff}`);
      console.log(`Last Updated: ${history.lastUpdated}`);
      
      const linkedCar = await Car.findOne({ vehicleHistory: history._id });
      if (linkedCar) {
        console.log(`✓ Linked to car: ${linkedCar.registration}`);
      } else {
        console.log(`⚠ Not linked to any car`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

diagnoseDeploymentHistoryIssue();
