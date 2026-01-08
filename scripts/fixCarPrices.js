require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixCarPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update MERCEDES-BENZ C-Class to have a price
    const result = await Car.updateOne(
      { make: 'MERCEDES-BENZ', model: 'C-Class' },
      { $set: { price: 15000 } }
    );

    console.log(`✅ Updated ${result.modifiedCount} car(s)`);
    console.log(`   - Set MERCEDES-BENZ C-Class price to £15,000\n`);

    // Verify the update
    const cars = await Car.find();
    console.log(`Total cars in database: ${cars.length}\n`);
    console.log('Updated cars:');
    cars.forEach(car => {
      console.log(`\n- ${car.make} ${car.model}`);
      console.log(`  Price: £${car.price}`);
      console.log(`  Condition: ${car.condition}`);
      console.log(`  Status: ${car.advertStatus}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCarPrices();
