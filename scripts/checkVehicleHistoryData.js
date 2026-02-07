require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const h = await VehicleHistory.findOne({vrm:'LS70UAK'}).sort({checkDate:-1});
  console.log('VehicleHistory Data:');
  console.log('Seats:', h.seats);
  console.log('Emission:', h.emissionClass);
  console.log('Urban MPG:', h.urbanMpg);
  console.log('Combined MPG:', h.combinedMpg);
  console.log('CO2:', h.co2Emissions);
  console.log('Tax:', h.annualTax);
  console.log('Transmission:', h.transmission);
  console.log('Variant:', h.variant);
  await mongoose.connection.close();
}
check();
