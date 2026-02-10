/**
 * Fix engine sizes - convert CC to litres permanently in database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function fixEngineSizes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars with engine size > 100 (assumed to be in CC)
    const cars = await Car.find({
      engineSize: { $gt: 100 }
    });
    
    console.log(`\n📊 Found ${cars.length} cars with engine size in CC`);
    
    let updated = 0;
    
    for (const car of cars) {
      const oldEngineSize = car.engineSize;
      const newEngineSize = (oldEngineSize / 1000).toFixed(1);
      
      car.engineSize = parseFloat(newEngineSize);
      await car.save();
      
      updated++;
      console.log(`✅ ${car.make} ${car.model}: ${oldEngineSize}cc → ${newEngineSize}L`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total cars updated: ${updated}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixEngineSizes();
