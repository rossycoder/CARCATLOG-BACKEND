/**
 * Test API response to ensure variant null strings are cleaned
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testVariantAPIResponse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find a car with null variant
    const carWithNull = await Car.findOne({ 
      variant: null 
    }).select('make model variant submodel engineSize fuelType transmission registrationNumber');

    if (!carWithNull) {
      console.log('No cars with null variant found');
      await mongoose.connection.close();
      return;
    }

    console.log('Found car with null variant:');
    console.log('Make:', carWithNull.make);
    console.log('Model:', carWithNull.model);
    console.log('Variant:', carWithNull.variant, '(type:', typeof carWithNull.variant, ')');
    console.log('Submodel:', carWithNull.submodel);
    console.log('Engine Size:', carWithNull.engineSize);
    console.log('Fuel Type:', carWithNull.fuelType);
    console.log('Transmission:', carWithNull.transmission);
    console.log('\nCar ID:', carWithNull._id);
    console.log('\nTest this car by visiting:');
    console.log(`http://localhost:5000/api/vehicles/${carWithNull._id}`);
    console.log('\nOr in frontend:');
    console.log(`http://localhost:5173/car/${carWithNull._id}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testVariantAPIResponse();
