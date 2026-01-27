require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkHondaCivicVariant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Search for the Honda Civic with registration RJ08PFA
    const car = await Car.findOne({ 
      registration: 'RJ08PFA' 
    });

    if (!car) {
      console.log('❌ Car not found with registration: RJ08PFA');
      return;
    }

    console.log('\n=== Car Details ===');
    console.log('Registration:', car.registration);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Price:', car.price);
    console.log('Location:', car.location);
    
    console.log('\n=== Variant Information ===');
    console.log('Variant:', car.variant);
    console.log('Variant is null?', car.variant === null);
    console.log('Variant is undefined?', car.variant === undefined);
    console.log('Variant is empty string?', car.variant === '');
    console.log('Variant type:', typeof car.variant);
    
    console.log('\n=== Full Vehicle Data ===');
    console.log('Fuel Type:', car.fuelType);
    console.log('Body Type:', car.bodyType);
    console.log('Transmission:', car.transmission);
    console.log('Engine Size:', car.engineSize);
    console.log('Doors:', car.doors);
    console.log('Year:', car.year);
    
    console.log('\n=== Raw Car Object ===');
    console.log(JSON.stringify(car, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkHondaCivicVariant();
