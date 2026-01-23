const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function testAutoDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== TEST 1: Create car WITHOUT displayTitle ===');
    
    // Create a test car without displayTitle
    const testCar = new Car({
      make: 'BMW',
      model: '3 Series',
      variant: '320d M Sport',
      year: 2020,
      price: 25000,
      mileage: 30000,
      color: 'Black',
      transmission: 'automatic',
      fuelType: 'Diesel',
      description: 'Test car for auto displayTitle generation',
      engineSize: 2.0,
      doors: 4,
      bodyType: 'Saloon',
      postcode: 'M1 1AA',
      locationName: 'Manchester',
      registrationNumber: 'TEST123',
      status: 'active',
      sellerType: 'private',
      dataSource: 'manual'
    });

    console.log('Before save - displayTitle:', testCar.displayTitle);
    
    await testCar.save();
    
    console.log('After save - displayTitle:', testCar.displayTitle);
    console.log('✅ Expected: "2.0 320d M Sport 4dr"');

    console.log('\n=== TEST 2: Create car WITH displayTitle (should not override) ===');
    
    const testCar2 = new Car({
      make: 'Audi',
      model: 'A4',
      variant: 'TDI S line',
      displayTitle: 'Custom Display Title',
      year: 2019,
      price: 20000,
      mileage: 40000,
      color: 'White',
      transmission: 'manual',
      fuelType: 'Diesel',
      description: 'Test car with existing displayTitle',
      engineSize: 2.0,
      doors: 4,
      bodyType: 'Saloon',
      postcode: 'M1 1AA',
      locationName: 'Manchester',
      registrationNumber: 'TEST456',
      status: 'active',
      sellerType: 'private',
      dataSource: 'manual'
    });

    console.log('Before save - displayTitle:', testCar2.displayTitle);
    
    await testCar2.save();
    
    console.log('After save - displayTitle:', testCar2.displayTitle);
    console.log('✅ Expected: "Custom Display Title" (should NOT change)');

    // Clean up test cars
    console.log('\n=== Cleaning up test cars ===');
    await Car.deleteOne({ registrationNumber: 'TEST123' });
    await Car.deleteOne({ registrationNumber: 'TEST456' });
    console.log('✅ Test cars deleted');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAutoDisplayTitle();
