const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function checkCarPhoneNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all active cars
    const cars = await Car.find({ advertStatus: 'active' }).limit(10);
    
    console.log(`\nFound ${cars.length} active cars\n`);
    console.log('='.repeat(80));

    cars.forEach((car, index) => {
      console.log(`\n${index + 1}. ${car.make} ${car.model} (${car._id})`);
      console.log(`   Seller Type: ${car.sellerContact?.type || car.sellerType || 'Not set'}`);
      console.log(`   Phone Number: ${car.sellerContact?.phoneNumber || 'NOT SET'}`);
      console.log(`   Email: ${car.sellerContact?.email || 'NOT SET'}`);
      console.log(`   Business Name: ${car.sellerContact?.businessName || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    
    // Count cars with and without phone numbers
    const carsWithPhone = await Car.countDocuments({ 
      'sellerContact.phoneNumber': { $exists: true, $ne: null, $ne: '' }
    });
    const totalCars = await Car.countDocuments();
    
    console.log(`\nSummary:`);
    console.log(`Total cars: ${totalCars}`);
    console.log(`Cars with phone numbers: ${carsWithPhone}`);
    console.log(`Cars without phone numbers: ${totalCars - carsWithPhone}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCarPhoneNumbers();
