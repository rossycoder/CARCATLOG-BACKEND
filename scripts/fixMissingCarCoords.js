/**
 * Fix: add default UK coordinates to the car missing location data
 * Run: node backend/scripts/fixMissingCarCoords.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Use UK geographic center as default coords
  const result = await Car.updateOne(
    { _id: '69ade08d67d5d79ecb6b7602' },
    {
      $set: {
        latitude: 52.3555,
        longitude: -1.1743,
        location: {
          type: 'Point',
          coordinates: [-1.1743, 52.3555] // GeoJSON: [lon, lat]
        }
      }
    }
  );

  console.log('Update result:', result);
  console.log('✅ BMW 3 Series HV69ZLK now has coordinates (UK center)');

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
