/**
 * Delete Test Cars
 * Delete incomplete test cars from database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function deleteTestCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const carIds = process.argv.slice(2);
    
    if (carIds.length === 0) {
      console.log('Usage: node deleteTestCars.js <carId1> [carId2] ...');
      console.log('Example: node deleteTestCars.js 69851434714547b1f87fac02\n');
      process.exit(1);
    }
    
    console.log(`🗑️  Deleting ${carIds.length} car(s)...\n`);
    
    for (const carId of carIds) {
      let car;
      if (/^[0-9a-fA-F]{24}$/.test(carId)) {
        car = await Car.findById(carId);
      } else {
        car = await Car.findOne({ 
          $or: [
            { advertId: carId },
            { registrationNumber: carId.toUpperCase() }
          ]
        });
      }
      
      if (!car) {
        console.log(`❌ Car not found: ${carId}\n`);
        continue;
      }
      
      console.log(`📋 Deleting car:`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   ID: ${car._id}`);
      
      await Car.deleteOne({ _id: car._id });
      console.log(`   ✅ Deleted\n`);
    }
    
    console.log('✅ All specified cars deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

deleteTestCars();
