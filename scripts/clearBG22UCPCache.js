/**
 * Clear cache for BG22UCP vehicle to force fresh API lookup
 * This will delete the VehicleHistory record so next lookup gets fresh data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function clearCache() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vrm = 'BG22UCP';
    
    // Find and delete the cached record
    const result = await VehicleHistory.deleteOne({ vrm: vrm });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Successfully deleted cache for ${vrm}`);
      console.log(`   Deleted ${result.deletedCount} record(s)`);
    } else {
      console.log(`⚠️  No cache found for ${vrm}`);
    }
    
    // Verify deletion
    const check = await VehicleHistory.findOne({ vrm: vrm });
    if (!check) {
      console.log(`✅ Verified: Cache for ${vrm} is cleared`);
      console.log(`   Next lookup will fetch fresh data from API`);
    } else {
      console.log(`❌ Error: Cache still exists for ${vrm}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

clearCache();
