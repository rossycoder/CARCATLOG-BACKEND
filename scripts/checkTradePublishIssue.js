/**
 * Check what data is in the car record that's failing to publish
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkTradePublishIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('Connected to MongoDB\n');

    // Find the car with the specific advertId from the error
    const advertId = 'aeae52a7-a111-4e72-8456-224a6e2c3a88';
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log(`No car found with advertId: ${advertId}`);
      return;
    }

    console.log('=== CAR RECORD ===');
    console.log('ID:', car._id);
    console.log('Advert ID:', car.advertId);
    console.log('Registration:', car.registrationNumber);
    console.log('Data Source:', car.dataSource);
    console.log('\n=== REQUIRED FIELDS FOR PUBLISH ===');
    console.log('Make:', car.make, car.make ? '✅' : '❌ MISSING');
    console.log('Model:', car.model, car.model ? '✅' : '❌ MISSING');
    console.log('Year:', car.year, car.year ? '✅' : '❌ MISSING');
    console.log('Mileage:', car.mileage, (car.mileage || car.mileage === 0) ? '✅' : '❌ MISSING');
    console.log('Fuel Type:', car.fuelType, car.fuelType ? '✅' : '❌ MISSING');
    console.log('Price:', car.price, car.price ? '✅' : '❌ MISSING');
    console.log('Description:', car.description ? `${car.description.substring(0, 50)}...` : null, car.description ? '✅' : '❌ MISSING');
    
    console.log('\n=== OTHER FIELDS ===');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Body Type:', car.bodyType);
    console.log('Engine Size:', car.engineSize);
    console.log('Transmission:', car.transmission);
    console.log('Color:', car.color);
    console.log('Postcode:', car.postcode);
    console.log('Images:', car.images?.length || 0);
    
    console.log('\n=== DATA SOURCES ===');
    console.log('Data Sources:', JSON.stringify(car.dataSources, null, 2));
    
    console.log('\n=== VALIDATION RESULT ===');
    const missingFields = [];
    if (!car.year) missingFields.push('year');
    if (!car.mileage && car.mileage !== 0) missingFields.push('mileage');
    if (!car.fuelType) missingFields.push('fuel type');
    if (!car.price) missingFields.push('price');
    if (!car.description) missingFields.push('description');
    
    if (missingFields.length > 0) {
      console.log('❌ VALIDATION WOULD FAIL');
      console.log('Missing fields:', missingFields.join(', '));
    } else {
      console.log('✅ VALIDATION WOULD PASS');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTradePublishIssue();
