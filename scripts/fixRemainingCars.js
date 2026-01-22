require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixRemainingCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Fix the car with "BMW 3" model
    const bmw3Cars = await Car.find({ make: 'BMW', model: '3' });
    console.log(`Found ${bmw3Cars.length} cars with "BMW 3" model\n`);

    for (const car of bmw3Cars) {
      console.log(`Fixing: ${car.registrationNumber}`);
      console.log(`Before: ${car.make} ${car.model} ${car.submodel || '(no submodel)'}`);
      
      car.model = '3 Series';
      await car.save();
      
      console.log(`After: ${car.make} ${car.model} ${car.submodel || '(no submodel)'}\n`);
    }

    // Check the Unknown car
    const unknownCars = await Car.find({ make: 'Unknown' });
    console.log(`Found ${unknownCars.length} cars with "Unknown" make\n`);

    for (const car of unknownCars) {
      console.log(`Unknown car: ${car.registrationNumber}`);
      console.log(`Current: ${car.make} ${car.model} ${car.submodel || '(no submodel)'}`);
      console.log(`Note: This car needs manual review - registration may be invalid\n`);
    }

    console.log('✅ Remaining cars fixed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixRemainingCars();
