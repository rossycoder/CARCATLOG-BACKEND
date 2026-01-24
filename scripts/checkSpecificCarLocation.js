require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const carId = '69738fa67bde58f466c26536';
    const car = await Car.findById(carId);

    if (!car) {
      console.log('Car not found');
      return;
    }

    console.log('\n=== CAR DATA ===');
    console.log('ID:', car._id);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Registration:', car.registrationNumber);
    console.log('\n=== LOCATION DATA ===');
    console.log('locationName:', car.locationName);
    console.log('postcode:', car.postcode);
    console.log('coordinates:', car.coordinates);
    
    console.log('\n=== SELLER INFO ===');
    console.log('sellerType:', car.sellerType);
    console.log('dealerName:', car.dealerName);
    console.log('dealerId:', car.dealerId);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkCar();
