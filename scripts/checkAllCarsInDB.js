/**
 * Check all cars in database regardless of status
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get total count
    const totalCars = await Car.countDocuments();
    console.log(`Total cars in database: ${totalCars}\n`);

    // Get count by status
    const statuses = await Car.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('Cars by status:');
    statuses.forEach(s => {
      console.log(`  ${s._id || 'undefined'}: ${s.count}`);
    });

    // Get cars with registration numbers
    const carsWithReg = await Car.countDocuments({
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    });
    console.log(`\nCars with registration numbers: ${carsWithReg}`);

    // Sample some cars
    const sampleCars = await Car.find()
      .select('registrationNumber make model status displayTitle')
      .limit(5);

    console.log('\n📋 Sample cars:');
    sampleCars.forEach((car, i) => {
      console.log(`\n${i + 1}. ${car.displayTitle || `${car.make} ${car.model}`}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Status: ${car.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllCars();
