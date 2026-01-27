require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const { v4: uuidv4 } = require('uuid');

async function createTestCar() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const dealerId = '696ba3eed4c19da93bb917b5';
  const advertId = uuidv4();
  
  console.log('Creating test car for dealer:', dealerId);
  console.log('Generated advertId:', advertId);
  
  const car = new Car({
    advertId: advertId,
    dealerId: dealerId,
    isDealerListing: true,
    make: 'BMW',
    model: '3 Series',
    year: 2020,
    mileage: 25000,
    color: 'Black',
    fuelType: 'Diesel',
    transmission: 'automatic',
    price: 25000,
    estimatedValue: 25000,
    description: 'Test car for trade dealer',
    images: [],
    registrationNumber: 'TEST123',
    engineSize: 2.0,
    bodyType: 'Saloon',
    doors: 4,
    seats: 5,
    postcode: 'M11AE',
    dataSource: 'manual',
    advertStatus: 'draft', // Changed from 'incomplete' to 'draft'
    condition: 'used'
  });
  
  await car.save();
  
  console.log('\n✅ Test car created successfully!');
  console.log('   Car ID:', car._id);
  console.log('   Advert ID:', car.advertId);
  console.log('   Dealer ID:', car.dealerId);
  console.log('\nNow you can navigate to:');
  console.log(`   http://localhost:3000/selling/advert/edit/${car.advertId}`);
  console.log('\nOr publish it at:');
  console.log(`   http://localhost:3000/selling/advert/contact/${car.advertId}`);
  
  await mongoose.disconnect();
}

createTestCar().catch(console.error);
