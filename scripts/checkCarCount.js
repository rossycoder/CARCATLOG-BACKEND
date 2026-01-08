const mongoose = require('mongoose');
const Car = require('../models/Car');
require('dotenv').config();

async function checkCarCount() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-marketplace';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const activeCount = await Car.countDocuments({ advertStatus: 'active' });
    console.log('Active cars (advertStatus: active):', activeCount);

    const totalCount = await Car.countDocuments({});
    console.log('Total cars in database:', totalCount);

    const statuses = await Car.collection.aggregate([
      { $group: { _id: '$advertStatus', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Cars by advertStatus:', statuses);

    const sample = await Car.findOne({});
    if (sample) {
      console.log('Sample car advertStatus:', sample.advertStatus);
      console.log('Sample car make:', sample.make);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCarCount();
