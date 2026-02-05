/**
 * Clear cache for any vehicle to force fresh API lookup
 * Usage: node clearCacheForVehicle.js <REGISTRATION>
 * Example: node clearCacheForVehicle.js BG22UCP
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function clearCache(vrm) {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${process.env.MONGODB_URI.includes('localhost') ? 'Local' : 'Production'}`);

    if (!vrm) {
      console.log('❌ Error: Registration number required');
      console.log('   Usage: node clearCacheForVehicle.js <REGISTRATION>');
      console.log('   Example: node clearCacheForVehicle.js BG22UCP');
      process.exit(1);
    }

    const cleanedVrm = vrm.toUpperCase().replace(/\s/g, '');
    console.log(`\n🔍 Looking for cache: ${cleanedVrm}`);
    
    // Check if cache exists
    const existing = await VehicleHistory.findOne({ vrm: cleanedVrm });
    
    if (!existing) {
      console.log(`⚠️  No cache found for ${cleanedVrm}`);
      console.log(`   This vehicle has no cached data`);
      process.exit(0);
    }
    
    // Show what will be deleted
    console.log(`\n📋 Found cached data:`);
    console.log(`   Make: ${existing.make || 'N/A'}`);
    console.log(`   Model: ${existing.model || 'N/A'}`);
    console.log(`   Year: ${existing.yearOfManufacture || 'N/A'}`);
    console.log(`   Cached on: ${existing.checkDate ? new Date(existing.checkDate).toLocaleDateString() : 'N/A'}`);
    console.log(`   Cache age: ${existing.checkDate ? Math.round((Date.now() - new Date(existing.checkDate).getTime()) / (24 * 60 * 60 * 1000)) : 'N/A'} days`);
    
    // Delete the cached record
    const result = await VehicleHistory.deleteOne({ vrm: cleanedVrm });
    
    if (result.deletedCount > 0) {
      console.log(`\n✅ Successfully deleted cache for ${cleanedVrm}`);
      console.log(`   Deleted ${result.deletedCount} record(s)`);
    } else {
      console.log(`\n❌ Failed to delete cache for ${cleanedVrm}`);
    }
    
    // Verify deletion
    const check = await VehicleHistory.findOne({ vrm: cleanedVrm });
    if (!check) {
      console.log(`\n✅ Verified: Cache for ${cleanedVrm} is cleared`);
      console.log(`   Next lookup will fetch fresh data from API`);
      console.log(`   Expected API cost: £0.00 (DVLA free) or £0.05 (CheckCarDetails fallback)`);
    } else {
      console.log(`\n❌ Error: Cache still exists for ${cleanedVrm}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   Cannot connect to database. Check MONGODB_URI in .env file');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Get registration from command line argument
const vrm = process.argv[2];
clearCache(vrm);
