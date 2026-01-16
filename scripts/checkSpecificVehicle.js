require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkVehicle() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const advertId = 'aac881b4-bd46-4021-a89d-17df0d7f4364';
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Vehicle not found');
      return;
    }

    console.log('\n✅ Vehicle found:');
    console.log('=====================================');
    console.log('ID:', car._id);
    console.log('Advert ID:', car.advertId);
    console.log('\nRequired Fields:');
    console.log('- make:', car.make || '❌ MISSING');
    console.log('- model:', car.model || '❌ MISSING');
    console.log('- year:', car.year || '❌ MISSING');
    console.log('- mileage:', car.mileage !== undefined ? car.mileage : '❌ MISSING');
    console.log('- color:', car.color || '❌ MISSING');
    console.log('- fuelType:', car.fuelType || '❌ MISSING');
    console.log('\nConditionally Required Fields:');
    console.log('- price:', car.price || '❌ MISSING');
    console.log('- transmission:', car.transmission || '❌ MISSING');
    console.log('- description:', car.description || '❌ MISSING');
    console.log('- postcode:', car.postcode || '❌ MISSING');
    console.log('\nOther Info:');
    console.log('- dataSource:', car.dataSource);
    console.log('- registrationNumber:', car.registrationNumber);
    console.log('- advertStatus:', car.advertStatus);
    console.log('- images:', car.images?.length || 0);
    
    console.log('\n=====================================');
    console.log('Full document:');
    console.log(JSON.stringify(car.toObject(), null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkVehicle();
