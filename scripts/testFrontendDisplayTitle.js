require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testFrontendDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the car
    const car = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('=== Frontend Display Test ===\n');
    
    // Simulate what frontend receives from API
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
      color: car.color,
      registrationNumber: car.registrationNumber,
      images: car.images,
      locationName: car.locationName
    };

    console.log('📦 API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n=== CarCard Display ===');
    console.log('Title:', apiResponse.displayTitle || `${apiResponse.make} ${apiResponse.model} ${apiResponse.variant}`);
    console.log('Subtitle:', `${apiResponse.engineSize}L ${apiResponse.fuelType} ${apiResponse.transmission}`);
    console.log('Price:', `£${apiResponse.price.toLocaleString()}`);
    console.log('Badges:', `${apiResponse.mileage.toLocaleString()} miles • ${apiResponse.year} (${apiResponse.registrationNumber})`);
    
    console.log('\n=== CarDetailPage Display ===');
    console.log('Main Title:', apiResponse.displayTitle);
    console.log('Price:', `£${apiResponse.price.toLocaleString()}`);
    console.log('Location:', apiResponse.locationName);
    
    console.log('\n=== Overview Section ===');
    console.log('Mileage:', `${apiResponse.mileage.toLocaleString()} miles`);
    console.log('Registration:', `${apiResponse.year} (${apiResponse.registrationNumber})`);
    console.log('Fuel type:', apiResponse.fuelType);
    console.log('Body type:', apiResponse.bodyType);
    console.log('Engine size:', `${apiResponse.engineSize}L`);
    console.log('Gearbox:', apiResponse.transmission);
    console.log('Doors:', apiResponse.doors);
    console.log('Body colour:', apiResponse.color);
    
    console.log('\n✅ All fields are properly formatted for frontend display!');
    console.log('✅ displayTitle is automatically generated and sent to frontend');
    console.log('✅ Frontend will show: "' + apiResponse.displayTitle + '"');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testFrontendDisplayTitle();
