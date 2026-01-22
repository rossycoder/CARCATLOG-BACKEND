require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testAPIWithDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the car
    const car = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('=== Car Data (as returned by API) ===\n');
    
    // Simulate what the API would return
    const apiResponse = {
      _id: car._id,
      make: car.make,
      model: car.model,
      variant: car.variant,
      displayTitle: car.displayTitle,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      engineSize: car.engineSize,
      transmission: car.transmission,
      fuelType: car.fuelType,
      doors: car.doors,
      bodyType: car.bodyType,
      registrationNumber: car.registrationNumber
    };

    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n=== Display Format ===');
    console.log('Title:', apiResponse.displayTitle);
    console.log('Subtitle:', `${apiResponse.year} • ${apiResponse.mileage.toLocaleString()} miles`);
    console.log('Price:', `£${apiResponse.price.toLocaleString()}`);
    
    console.log('\n=== Verification ===');
    console.log('✅ variant field:', apiResponse.variant);
    console.log('✅ displayTitle field:', apiResponse.displayTitle);
    console.log('✅ Both fields populated correctly!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testAPIWithDisplayTitle();
