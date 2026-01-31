require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function addMockDistance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all active cars with a mock distance (for testing)
    const result = await Car.updateMany(
      { advertStatus: 'active' },
      { $set: { distance: 7 } } // Mock 7 miles distance
    );

    console.log(`\n✅ Updated ${result.modifiedCount} cars with mock distance of 7 miles`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addMockDistance();
