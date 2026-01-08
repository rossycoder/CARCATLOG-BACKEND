require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkFilterOptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check total cars
    const totalCars = await Car.countDocuments();
    console.log('Total cars in database:', totalCars);

    // Check active cars
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log('Active cars:', activeCars);

    // Check all advertStatus values
    const statuses = await Car.distinct('advertStatus');
    console.log('All advertStatus values:', statuses);
    console.log('');

    // Count by status
    for (const status of statuses) {
      const count = await Car.countDocuments({ advertStatus: status });
      console.log(`  ${status}: ${count} cars`);
    }
    console.log('');

    // If no active cars, show sample cars
    if (activeCars === 0) {
      console.log('No active cars found! Showing sample cars:');
      const sampleCars = await Car.find().limit(5);
      sampleCars.forEach(car => {
        console.log(`  - ${car.make} ${car.model} (${car.year}) - Status: ${car.advertStatus}`);
      });
      console.log('');
      console.log('SOLUTION: You need to set advertStatus to "active" for cars to appear in filters.');
      console.log('Run this command to activate all cars:');
      console.log('  db.cars.updateMany({}, { $set: { advertStatus: "active" } })');
    } else {
      // Get filter options
      console.log('Filter options from active cars:');
      const makes = await Car.distinct('make', { advertStatus: 'active' });
      console.log('  Makes:', makes.length, '-', makes.slice(0, 10).join(', '));
      
      const models = await Car.distinct('model', { advertStatus: 'active' });
      console.log('  Models:', models.length, '-', models.slice(0, 10).join(', '));
      
      const fuelTypes = await Car.distinct('fuelType', { advertStatus: 'active' });
      console.log('  Fuel Types:', fuelTypes);
      
      const transmissions = await Car.distinct('transmission', { advertStatus: 'active' });
      console.log('  Transmissions:', transmissions);
      
      const bodyTypes = await Car.distinct('bodyType', { advertStatus: 'active' });
      console.log('  Body Types:', bodyTypes);
      
      const colours = await Car.distinct('color', { advertStatus: 'active' });
      console.log('  Colours:', colours.length, '-', colours.slice(0, 10).join(', '));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFilterOptions();
