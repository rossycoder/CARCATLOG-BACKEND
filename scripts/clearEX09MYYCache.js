require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function clearCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const vrm = 'EX09MYY';
    
    // Find and delete the cached history record
    const result = await VehicleHistory.deleteOne({ vrm: vrm });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Cleared cached history for ${vrm}`);
      console.log('Next time this vehicle is viewed, fresh data will be fetched from the API');
    } else {
      console.log(`ℹ️ No cached history found for ${vrm}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearCache();
