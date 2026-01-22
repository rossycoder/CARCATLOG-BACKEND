const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function testFilterOptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check total cars
    const totalCars = await Car.countDocuments({});
    console.log('\n=== Total Cars ===');
    console.log('Total:', totalCars);

    // Check cars by advertStatus
    const activeCount = await Car.countDocuments({ advertStatus: 'active' });
    const draftCount = await Car.countDocuments({ advertStatus: 'draft' });
    const otherCount = totalCars - activeCount - draftCount;
    
    console.log('\n=== By Advert Status ===');
    console.log('Active:', activeCount);
    console.log('Draft:', draftCount);
    console.log('Other:', otherCount);

    // Get unique makes
    const makes = await Car.distinct('make', { advertStatus: 'active' });
    console.log('\n=== Makes (active) ===');
    console.log('Count:', makes.length);
    console.log('Values:', makes.filter(Boolean).sort());

    // Get unique models
    const models = await Car.distinct('model', { advertStatus: 'active' });
    console.log('\n=== Models (active) ===');
    console.log('Count:', models.length);
    console.log('Sample:', models.filter(Boolean).sort().slice(0, 10));

    // Get unique fuel types
    const fuelTypes = await Car.distinct('fuelType', { advertStatus: 'active' });
    console.log('\n=== Fuel Types (active) ===');
    console.log('Values:', fuelTypes.filter(Boolean).sort());

    // Get unique transmissions
    const transmissions = await Car.distinct('transmission', { advertStatus: 'active' });
    console.log('\n=== Transmissions (active) ===');
    console.log('Values:', transmissions.filter(Boolean).sort());

    // Get unique body types
    const bodyTypes = await Car.distinct('bodyType', { advertStatus: 'active' });
    console.log('\n=== Body Types (active) ===');
    console.log('Values:', bodyTypes.filter(Boolean).sort());

    // Get unique colours
    const colours = await Car.distinct('color', { advertStatus: 'active' });
    console.log('\n=== Colours (active) ===');
    console.log('Values:', colours.filter(Boolean).sort());

    // Sample car to check field names
    const sampleCar = await Car.findOne({ advertStatus: 'active' });
    if (sampleCar) {
      console.log('\n=== Sample Active Car ===');
      console.log('Make:', sampleCar.make);
      console.log('Model:', sampleCar.model);
      console.log('Year:', sampleCar.year);
      console.log('Mileage:', sampleCar.mileage);
      console.log('Price:', sampleCar.price);
      console.log('Color:', sampleCar.color);
      console.log('Transmission:', sampleCar.transmission);
      console.log('FuelType:', sampleCar.fuelType);
      console.log('BodyType:', sampleCar.bodyType);
      console.log('AdvertStatus:', sampleCar.advertStatus);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFilterOptions();
