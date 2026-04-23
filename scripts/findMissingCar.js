/**
 * Diagnostic script: find which active car is missing from postcode search results
 * Run: node backend/scripts/findMissingCar.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const allActive = await Car.find({ advertStatus: 'active' })
    .select('_id make model year registrationNumber latitude longitude location advertStatus')
    .lean();

  console.log(`Total active cars: ${allActive.length}\n`);

  const withCoords = [];
  const withoutCoords = [];

  for (const car of allActive) {
    const hasLatLon = car.latitude !== undefined && car.longitude !== undefined;
    const hasGeoJSON = car.location?.coordinates?.length === 2;

    if (hasLatLon || hasGeoJSON) {
      withCoords.push(car);
    } else {
      withoutCoords.push(car);
    }
  }

  console.log(`Cars WITH coordinates: ${withCoords.length}`);
  console.log(`Cars WITHOUT coordinates (missing from search): ${withoutCoords.length}\n`);

  if (withoutCoords.length > 0) {
    console.log('--- Cars missing coordinates ---');
    withoutCoords.forEach(car => {
      console.log(`  ID: ${car._id}`);
      console.log(`  ${car.make} ${car.model} (${car.year}) - Reg: ${car.registrationNumber}`);
      console.log(`  latitude: ${car.latitude}, longitude: ${car.longitude}`);
      console.log(`  location: ${JSON.stringify(car.location)}`);
      console.log('');
    });
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
