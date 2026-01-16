require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

async function fixSingleCar() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'FP15 UAU';
    console.log(`Fixing vehicle: ${vrm}\n`);

    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    if (!car) {
      console.log('❌ Car not found in database');
      process.exit(1);
    }

    console.log(`Current: ${car.make} ${car.model}`);

    // Fetch fresh data from API (bypass cache)
    const historyService = new HistoryService();
    const historyData = await historyService.checkVehicleHistory(vrm, true); // Force fresh call

    console.log(`API Data: ${historyData.make} ${historyData.model}`);

    // Update
    car.make = historyData.make || car.make;
    car.model = historyData.model || car.model;
    await car.save();

    console.log(`\n✅ Updated: ${car.make} ${car.model}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixSingleCar();
