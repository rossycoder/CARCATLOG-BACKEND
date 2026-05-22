require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixCarOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const correctUserId = '69777c2416ef8e4c8cb3f422'; // rozeena031@gmail.com
    const carReg = 'MA57LDL';

    const car = await Car.findOne({ registrationNumber: carReg });

    if (!car) {
      console.log(`❌ Car not found: ${carReg}`);
      await mongoose.connection.close();
      return;
    }

    console.log(`Found: ${car.make} ${car.model} (${car.year}) - ${carReg}`);
    console.log(`Current userId: ${car.userId}`);
    console.log(`Updating to: ${correctUserId}`);

    car.userId = correctUserId;
    await car.save({ validateBeforeSave: false });

    console.log(`\n✅ Car ownership fixed! Now linked to rozeena031@gmail.com`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCarOwnership();
