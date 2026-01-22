require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAllCarModels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const cars = await Car.find({}).select('make model submodel registrationNumber');

    console.log(`Total cars: ${cars.length}\n`);
    console.log('Current model hierarchy for all cars:');
    console.log('='.repeat(70));

    cars.forEach((car, index) => {
      console.log(`\n${index + 1}. Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Make: ${car.make}`);
      console.log(`   Model: ${car.model}`);
      console.log(`   Submodel: ${car.submodel || '(not set)'}`);
    });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkAllCarModels();
