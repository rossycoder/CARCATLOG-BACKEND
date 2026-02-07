require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const car = await Car.findById('698682fd4c9aa2475ac2cb91');
  console.log('Car Created:', car.createdAt);
  console.log('Car Updated:', car.updatedAt);
  console.log('Time since creation:', Math.round((Date.now() - car.createdAt) / 1000 / 60), 'minutes ago');
  await mongoose.connection.close();
}
check();
