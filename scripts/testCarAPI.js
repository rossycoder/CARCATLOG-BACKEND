const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function testCarAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get the first car with a phone number
    const car = await Car.findOne({
      advertStatus: 'active',
      'sellerContact.phoneNumber': { $exists: true, $ne: null, $ne: '' }
    });

    if (!car) {
      console.log('No cars found with phone numbers');
      return;
    }

    console.log('Car ID:', car._id);
    console.log('Make/Model:', car.make, car.model);
    console.log('\n--- Seller Contact Object ---');
    console.log(JSON.stringify(car.sellerContact, null, 2));
    
    console.log('\n--- What the API would return ---');
    const apiResponse = {
      _id: car._id,
      make: car.make,
      model: car.model,
      sellerContact: car.sellerContact,
      sellerType: car.sellerType
    };
    console.log(JSON.stringify(apiResponse, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testCarAPI();
