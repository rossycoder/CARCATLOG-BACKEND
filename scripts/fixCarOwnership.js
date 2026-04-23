require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

const REG = 'MA57LDL';
const CORRECT_EMAIL = 'rozeena.careers031@gmail.com';

async function fixCarOwnership() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Find the correct user
  const correctUser = await User.findOne({ email: CORRECT_EMAIL });
  if (!correctUser) {
    console.log(`❌ User not found: ${CORRECT_EMAIL}`);
    await mongoose.disconnect();
    return;
  }
  console.log(`✅ Correct user found: ${correctUser._id} (${correctUser.email})`);

  // Find the car
  const car = await Car.findOne({ registrationNumber: REG });
  if (!car) {
    console.log(`❌ Car not found: ${REG}`);
    await mongoose.disconnect();
    return;
  }
  console.log(`✅ Car found: ${car._id}, current userId: ${car.userId}`);

  // Update userId
  car.userId = correctUser._id;
  await car.save();

  console.log(`✅ Car ownership fixed — ${REG} now belongs to ${CORRECT_EMAIL}`);
  await mongoose.disconnect();
}

fixCarOwnership().catch(console.error);
