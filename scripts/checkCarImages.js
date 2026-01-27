require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const carId = '69791271c1735a74c31a96e7';
  
  const car = await Car.findById(carId);
  
  if (!car) {
    console.log('Car not found!');
    return;
  }
  
  console.log('\nCar Details:');
  console.log('ID:', car._id);
  console.log('Make/Model:', car.make, car.model);
  console.log('Year:', car.year);
  console.log('Price:', car.price);
  console.log('\nImages:');
  console.log('Type:', typeof car.images);
  console.log('Is Array:', Array.isArray(car.images));
  console.log('Length:', car.images?.length);
  console.log('\nImage URLs:');
  if (car.images) {
    car.images.forEach((img, i) => {
      console.log(`${i + 1}. ${img}`);
    });
  }
  
  await mongoose.disconnect();
}

checkCarImages().catch(console.error);
