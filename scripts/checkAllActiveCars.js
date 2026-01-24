const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function checkAllActiveCars() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all active cars
    const activeCars = await Car.find({
      advertStatus: 'active'
    }).select('make model color year registrationNumber');

    console.log(`Found ${activeCars.length} active car(s):\n`);
    
    activeCars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.year} ${car.make} ${car.model}`);
      console.log(`   Color: ${car.color}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log('');
    });

    // Get all unique colors
    const allColors = await Car.distinct('color', { advertStatus: 'active' });
    console.log('\n--- All Unique Colors ---');
    console.log(allColors.sort());

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllActiveCars();
