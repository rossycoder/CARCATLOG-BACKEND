/**
 * Clear YD17AVU cache so it will fetch fresh data with new parser
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function clearYD17AVUCache() {
  try {
    console.log('🗑️  Clearing YD17AVU Cache');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const VehicleHistory = require('../models/VehicleHistory');
    
    const result = await VehicleHistory.deleteMany({ vrm: 'YD17AVU' });
    
    console.log(`✅ Deleted ${result.deletedCount} cache record(s) for YD17AVU`);
    console.log('\nNext lookup will fetch fresh data from API with new parser!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearYD17AVUCache();
