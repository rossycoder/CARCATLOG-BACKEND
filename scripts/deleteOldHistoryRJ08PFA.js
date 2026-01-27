/**
 * Delete old vehicle history record for RJ08PFA
 */

const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
require('dotenv').config();

async function deleteOldHistory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const vrm = 'RJ08PFA';
    
    // Delete all history records for this VRM
    const result = await VehicleHistory.deleteMany({ vrm: vrm.toUpperCase() });
    
    console.log(`\n🗑️  Deleted ${result.deletedCount} history record(s) for VRM: ${vrm}`);
    console.log('💡 Now the API will fetch fresh data from CheckCarDetails');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

deleteOldHistory();
