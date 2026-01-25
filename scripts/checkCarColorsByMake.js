const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarColorsByMake() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active cars grouped by make
    const carsByMake = await Car.aggregate([
      { $match: { advertStatus: 'active' } },
      {
        $group: {
          _id: '$make',
          colors: { $addToSet: '$color' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Cars by Make with Colors:\n');
    carsByMake.forEach(group => {
      console.log(`${group._id}:`);
      console.log(`  Count: ${group.count}`);
      console.log(`  Colors: ${group.colors.join(', ')}`);
      console.log('');
    });

    // Get Honda cars specifically
    console.log('\n🚗 Honda Cars Details:');
    const hondaCars = await Car.find({ 
      advertStatus: 'active',
      make: 'HONDA'
    }).select('make model variant color registrationNumber');
    
    hondaCars.forEach(car => {
      console.log(`  ${car.registrationNumber} - ${car.make} ${car.model} ${car.variant || 'N/A'} - Color: ${car.color}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCarColorsByMake();
