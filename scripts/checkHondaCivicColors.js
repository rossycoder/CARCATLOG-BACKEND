const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function checkHondaCivicColors() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all Honda Civics
    const hondaCivics = await Car.find({
      make: 'Honda',
      model: 'Civic',
      advertStatus: 'active'
    }).select('make model color year registrationNumber');

    console.log(`Found ${hondaCivics.length} Honda Civic(s):\n`);
    
    hondaCivics.forEach((car, index) => {
      console.log(`${index + 1}. ${car.year} Honda Civic`);
      console.log(`   Color: ${car.color}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   ID: ${car._id}`);
      console.log('');
    });

    // Get all unique colors in the database
    console.log('\n--- All Colors in Database ---');
    const allColors = await Car.distinct('color', { advertStatus: 'active' });
    console.log('All colors:', allColors.sort());

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHondaCivicColors();
