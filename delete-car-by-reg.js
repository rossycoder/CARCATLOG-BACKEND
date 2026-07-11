/**
 * Delete car by registration number from database
 * Run: node delete-car-by-reg.js EA65AMX
 */

require('dotenv').config();
const mongoose = require('mongoose');

const reg = (process.argv[2] || '').toUpperCase().replace(/\s/g, '');

if (!reg) {
  process.exit(1);
}

async function deleteByReg() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Car = require('./models/Car');

    // Find all cars with this registration (case insensitive)
    const cars = await Car.find({ 
      registrationNumber: { $regex: new RegExp(`^${reg}$`, 'i') } 
    }).lean();

    if (cars.length === 0) {
      process.exit(0);
    }

    console.log(`\nFound ${cars.length} car(s):`);
    cars.forEach(c => {
    });

    // Delete all
    const result = await Car.deleteMany({ 
      registrationNumber: { $regex: new RegExp(`^${reg}$`, 'i') } 
    });

    console.log(`\n✅ Deleted ${result.deletedCount} car(s) with registration ${reg}`);

  } catch (err) {
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

deleteByReg();
