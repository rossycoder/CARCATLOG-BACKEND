const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkHondaCivicVariants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Honda Civic cars
    const hondaCivics = await Car.find({ 
      advertStatus: 'active',
      make: 'HONDA',
      model: 'Civic'
    }).select('make model variant submodel color bodyType transmission registrationNumber');
    
    console.log('🚗 Honda Civic Cars:\n');
    hondaCivics.forEach(car => {
      console.log(`Registration: ${car.registrationNumber}`);
      console.log(`  Make: ${car.make}`);
      console.log(`  Model: ${car.model}`);
      console.log(`  Variant: "${car.variant}"`);
      console.log(`  Submodel: "${car.submodel}"`);
      console.log(`  Color: ${car.color}`);
      console.log(`  Body Type: ${car.bodyType}`);
      console.log(`  Transmission: ${car.transmission}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHondaCivicVariants();
