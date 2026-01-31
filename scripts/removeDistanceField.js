require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function removeDistanceField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars with distance field
    const carsWithDistance = await Car.find({ distance: { $exists: true } });
    console.log(`Found ${carsWithDistance.length} cars with distance field\n`);

    if (carsWithDistance.length > 0) {
      console.log('🔧 Removing distance field from all cars...');
      
      // Remove distance field from all cars
      const result = await Car.updateMany(
        { distance: { $exists: true } },
        { $unset: { distance: "" } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} cars`);
      console.log('\n⚠️  Distance field removed from database!');
      console.log('   Distance will now be calculated at runtime based on user location.');
    } else {
      console.log('✅ No cars have distance field in database');
      console.log('   Distance is being calculated at runtime (correct behavior)');
    }

    // Verify
    const check = await Car.findOne({ make: 'SKODA', model: 'Octavia' });
    console.log('\n📍 Sample Car Check:');
    console.log('   Make/Model:', check.make, check.model);
    console.log('   Has distance field:', check.distance !== undefined);
    console.log('   Distance value:', check.distance);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

removeDistanceField();
