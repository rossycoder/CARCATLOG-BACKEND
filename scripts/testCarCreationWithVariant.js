/**
 * Test that variant is automatically saved when creating a new car
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const dvlaService = require('../services/dvlaService');
const Car = require('../models/Car');

async function testCarCreationWithVariant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Simulate DVLA data
    const mockDvlaData = {
      make: 'HONDA',
      model: 'Civic',
      yearOfManufacture: 2008,
      colour: 'SILVER',
      fuelType: 'DIESEL',
      engineCapacity: 2204, // cc
      registrationNumber: 'TEST123',
      co2Emissions: 139,
      taxStatus: 'Taxed',
      motStatus: 'Valid'
    };

    const mileage = 85000;
    const additionalData = {
      price: 3995,
      postcode: 'SW1A 1AA',
      description: 'Great condition Honda Civic',
      transmission: 'manual'
    };

    console.log('Step 1: Map DVLA data to Car schema');
    console.log('=====================================');
    const carData = dvlaService.mapDVLADataToCarSchema(mockDvlaData, mileage, additionalData);
    
    console.log('\nMapped Car Data:');
    console.log('Make:', carData.make);
    console.log('Model:', carData.model);
    console.log('Engine Size:', carData.engineSize, 'L');
    console.log('Fuel Type:', carData.fuelType);
    console.log('Transmission:', carData.transmission);
    console.log('Variant:', carData.variant);
    console.log('');

    if (!carData.variant) {
      console.log('❌ ERROR: Variant was not generated!');
      await mongoose.connection.close();
      return;
    }

    console.log('✅ Variant generated:', carData.variant);
    console.log('');

    console.log('Step 2: Create Car record in database');
    console.log('======================================');
    
    // Check if test car already exists
    const existingCar = await Car.findOne({ registrationNumber: 'TEST123' });
    if (existingCar) {
      console.log('Test car already exists, deleting...');
      await Car.deleteOne({ registrationNumber: 'TEST123' });
    }

    // Create new car
    const car = new Car(carData);
    await car.save();
    
    console.log('✅ Car saved to database');
    console.log('Car ID:', car._id);
    console.log('');

    console.log('Step 3: Verify variant was saved');
    console.log('=================================');
    
    // Fetch the car from database
    const savedCar = await Car.findById(car._id);
    
    console.log('Retrieved from database:');
    console.log('Make:', savedCar.make);
    console.log('Model:', savedCar.model);
    console.log('Variant:', savedCar.variant);
    console.log('');

    if (savedCar.variant) {
      console.log('✅ SUCCESS: Variant was saved to database!');
      console.log(`   Variant: "${savedCar.variant}"`);
    } else {
      console.log('❌ ERROR: Variant was NOT saved to database!');
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await Car.deleteOne({ _id: car._id });
    console.log('✅ Test car deleted');

    await mongoose.connection.close();
    console.log('\n✅ Test Complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCarCreationWithVariant();
