require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixSkodaOctaviaVariant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const carId = '6970fc66148e86075202b275';
    const correctVariant = '1.6 TDI S Euro 5 5dr';

    console.log(`\nLooking for car with ID: ${carId}`);
    
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('\n📋 Current car data:');
    console.log(`Make: ${car.make}`);
    console.log(`Model: ${car.model}`);
    console.log(`Current submodel: ${car.submodel || 'NOT SET'}`);
    console.log(`Registration: ${car.registrationNumber}`);

    // Update the submodel field
    car.submodel = correctVariant;
    await car.save();

    console.log('\n✅ Successfully updated!');
    console.log(`New submodel: ${car.submodel}`);
    console.log(`\nView at: /cars/${carId}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixSkodaOctaviaVariant();
