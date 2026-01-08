require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function verifyCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const cars = await Car.find();
    console.log(`Total cars in database: ${cars.length}\n`);

    if (cars.length === 0) {
      console.log('No cars found in database.');
    } else {
      console.log('Cars in database:');
      cars.forEach(car => {
        console.log(`\n- ${car.make} ${car.model}`);
        console.log(`  Registration: ${car.registrationNumber}`);
        console.log(`  Price: £${car.price}`);
        console.log(`  Location: ${car.postcode} (${car.latitude}, ${car.longitude})`);
        console.log(`  Status: ${car.advertStatus}`);
        console.log(`  Photos: ${car.images.length}`);
        console.log(`  Advert ID: ${car.advertId}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyCars();
