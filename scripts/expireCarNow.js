/**
 * Expire a car listing immediately for testing
 * Usage: node scripts/expireCarNow.js MA57LDL
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('../models/Car');

async function expireCarNow(registration) {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  const car = await Car.findOne({ registrationNumber: new RegExp(registration, 'i') });
  if (!car) return console.log('❌ Car not found:', registration);

  console.log(`Found: ${car.make} ${car.model} (${car.registrationNumber})`);
  console.log(`Current status: ${car.advertStatus}`);
  console.log(`Current expiry: ${car.advertisingPackage?.expiryDate}`);

  // Set expiry to yesterday and status to expired
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  car.advertStatus = 'expired';
  if (car.advertisingPackage) {
    car.advertisingPackage.expiryDate = yesterday;
  }
  await car.save();

  console.log(`\n✅ Done! Status set to 'expired', expiry set to ${yesterday.toLocaleString()}`);
  await mongoose.connection.close();
}

const reg = process.argv[2];
if (!reg) {
  console.log('Usage: node scripts/expireCarNow.js <REGISTRATION>');
  process.exit(1);
}
expireCarNow(reg).catch(console.error);
