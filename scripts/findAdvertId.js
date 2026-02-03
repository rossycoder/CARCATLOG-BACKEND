const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findAdvertId() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    // Find the EK11XHZ car
    const car = await Car.findOne({ registrationNumber: 'EK11XHZ' });
    
    if (car) {
      console.log('🚗 Found car:');
      console.log(`   Registration: ${car.registrationNumber}`);
      console.log(`   Car ID: ${car._id}`);
      console.log(`   Advert Status: ${car.advertStatus}`);
      console.log(`   Price: £${car.price}`);
      console.log(`   Has running costs: ${!!car.runningCosts?.annualTax}`);
      console.log('');
      console.log('🔗 CarAdvertEditPage URL:');
      console.log(`   http://localhost:3001/edit-advert/${car._id}`);
    } else {
      console.log('❌ No car found with registration EK11XHZ');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findAdvertId();