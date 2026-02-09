/**
 * Clear AY10AYL Cache and Force Fresh Data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function clearCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const vrm = 'AY10AYL';
    
    console.log(`🗑️  Deleting cache for ${vrm}...`);
    const result = await VehicleHistory.deleteMany({ vrm: vrm });
    console.log(`✅ Deleted ${result.deletedCount} cache record(s)\n`);
    
    console.log('✅ Cache cleared! Now add the car again to get fresh data.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

clearCache();
