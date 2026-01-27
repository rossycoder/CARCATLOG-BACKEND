require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findManchesterHonda() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Search for Honda Civic from Manchester
    const cars = await Car.find({ 
      make: { $regex: /honda/i },
      model: { $regex: /civic/i },
      location: { $regex: /manchester/i }
    }).limit(10);

    console.log(`\nFound ${cars.length} Honda Civic cars from Manchester:\n`);

    cars.forEach((car, index) => {
      console.log(`\n=== Car ${index + 1} ===`);
      console.log('Registration:', car.registration);
      console.log('Make:', car.make);
      console.log('Model:', car.model);
      console.log('Variant:', car.variant || 'NULL/EMPTY');
      console.log('Price:', car.price);
      console.log('Location:', car.location);
      console.log('Fuel Type:', car.fuelType);
      console.log('Body Type:', car.bodyType);
      console.log('Doors:', car.doors);
      console.log('_id:', car._id);
    });

    // Also search by price £2,222
    console.log('\n\n=== Searching by price £2,222 ===');
    const carsByPrice = await Car.find({ 
      price: { $in: [2222, '2222'] }
    }).limit(5);

    console.log(`\nFound ${carsByPrice.length} cars with price £2,222:\n`);
    carsByPrice.forEach((car, index) => {
      console.log(`\n=== Car ${index + 1} ===`);
      console.log('Registration:', car.registration);
      console.log('Make:', car.make);
      console.log('Model:', car.model);
      console.log('Variant:', car.variant || 'NULL/EMPTY');
      console.log('Price:', car.price);
      console.log('Location:', car.location);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

findManchesterHonda();
