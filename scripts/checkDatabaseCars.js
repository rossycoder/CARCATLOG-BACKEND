const mongoose = require('mongoose');
const Car = require('../models/Car');
require('dotenv').config({ path: './backend/.env' });

async function checkDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const totalCount = await Car.countDocuments({});
    console.log('Total cars in database:', totalCount);

    const activeCount = await Car.countDocuments({ advertStatus: 'active' });
    console.log('Active cars:', activeCount);

    if (totalCount > 0) {
      const samples = await Car.find({}).limit(3);
      console.log('\nSample cars:');
      samples.forEach((car, i) => {
        console.log(`${i + 1}. ${car.year} ${car.make} ${car.model} - Status: ${car.advertStatus}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
