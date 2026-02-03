const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function clearCacheForVehicle() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const registration = 'EK11XHZ';
    
    // Delete cached data for this vehicle
    const result = await VehicleHistory.deleteMany({ vrm: registration });
    console.log(`🗑️ Deleted ${result.deletedCount} cache records for ${registration}`);
    
    console.log('✅ Cache cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearCacheForVehicle();