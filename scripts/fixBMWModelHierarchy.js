const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixBMW() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const car = await Car.findOne({ registrationNumber: 'AV13NFC' });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(0);
    }

    console.log('=== BEFORE UPDATE ===');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Submodel:', car.submodel);

    // Update with correct hierarchy
    car.make = 'BMW';
    car.model = '3 Series';
    car.submodel = '335I M Sport';

    await car.save();

    console.log('\n=== AFTER UPDATE ===');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Submodel:', car.submodel);

    console.log('\n✅ BMW vehicle hierarchy updated successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixBMW();
