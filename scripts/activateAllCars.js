require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check current status
    const totalCars = await Car.countDocuments();
    console.log('Total cars in database:', totalCars);

    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log('Currently active cars:', activeCars);
    console.log('');

    if (activeCars === totalCars) {
      console.log('✓ All cars are already active!');
      await mongoose.disconnect();
      return;
    }

    // Show current status distribution
    const statuses = await Car.distinct('advertStatus');
    console.log('Current status distribution:');
    for (const status of statuses) {
      const count = await Car.countDocuments({ advertStatus: status });
      console.log(`  ${status}: ${count} cars`);
    }
    console.log('');

    // Update all cars to active
    console.log('Activating all cars...');
    const result = await Car.updateMany(
      { advertStatus: { $ne: 'active' } },
      { $set: { advertStatus: 'active' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} cars to active status`);
    console.log('');

    // Verify
    const newActiveCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log('Active cars after update:', newActiveCars);

    await mongoose.disconnect();
    console.log('\n✓ Done! All cars are now active and will appear in filters.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

activateAllCars();
