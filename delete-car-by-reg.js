/**
 * Delete car by registration number from database
 * Run: node delete-car-by-reg.js EA65AMX
 */

require('dotenv').config();
const mongoose = require('mongoose');

const reg = (process.argv[2] || '').toUpperCase().replace(/\s/g, '');

if (!reg) {
  console.error('Usage: node delete-car-by-reg.js <REGISTRATION>');
  process.exit(1);
}

async function deleteByReg() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const Car = require('./models/Car');

    // Find all cars with this registration (case insensitive)
    const cars = await Car.find({ 
      registrationNumber: { $regex: new RegExp(`^${reg}$`, 'i') } 
    }).lean();

    if (cars.length === 0) {
      console.log(`❌ No cars found with registration: ${reg}`);
      process.exit(0);
    }

    console.log(`\nFound ${cars.length} car(s):`);
    cars.forEach(c => {
      console.log(`  - ID: ${c._id}`);
      console.log(`    Make/Model: ${c.make} ${c.model}`);
      console.log(`    Status: ${c.advertStatus}`);
      console.log(`    Created: ${c.createdAt}`);
    });

    // Delete all
    const result = await Car.deleteMany({ 
      registrationNumber: { $regex: new RegExp(`^${reg}$`, 'i') } 
    });

    console.log(`\n✅ Deleted ${result.deletedCount} car(s) with registration ${reg}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

deleteByReg();
