const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('../models/Car');

async function checkCarStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    
    const totalCount = await Car.countDocuments();
    const activeCount = await Car.countDocuments({ advertStatus: 'active' });
    const sample = await Car.findOne().select('advertStatus make model price');
    
    console.log('Total cars in database:', totalCount);
    console.log('Active cars (advertStatus: active):', activeCount);
    console.log('Sample car:', sample);
    
    // Check what advertStatus values exist
    const statuses = await Car.distinct('advertStatus');
    console.log('Existing advertStatus values:', statuses);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCarStatus();
