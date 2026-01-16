const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function checkVehicle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('Connected to MongoDB');

    const advertId = '1abf3105-ee0d-4bf3-b94c-7e090845b4f1';
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('Vehicle not found!');
      return;
    }

    console.log('\n=== VEHICLE DATA ===');
    console.log('ID:', car._id);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Year:', car.year);
    console.log('Mileage:', car.mileage);
    console.log('FuelType:', car.fuelType);
    console.log('Transmission:', car.transmission);
    console.log('Color:', car.color);
    console.log('Price:', car.price);
    console.log('Description:', car.description);
    console.log('Registration:', car.registrationNumber);
    console.log('Status:', car.advertStatus);
    
    console.log('\n=== TESTING UPDATE WITHOUT VALIDATION ===');
    
    // Try to update without validation
    const result = await Car.updateOne(
      { _id: car._id },
      { 
        $set: {
          advertStatus: 'active',
          publishedAt: new Date(),
          dealerId: new mongoose.Types.ObjectId('6946b4898d690de58ba3ef8c'),
          isDealerListing: true
        }
      },
      { runValidators: false }
    );
    
    console.log('Update result:', result);
    console.log('\n✅ Update successful!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkVehicle();
