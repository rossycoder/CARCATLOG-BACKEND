/**
 * Cleanup incorrect vehicle history records
 * This script finds and deletes all history records where numberOfPreviousKeepers is 0
 * but the record claims to be successful
 */

const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
require('dotenv').config();

async function cleanupIncorrectRecords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Searching for incorrect vehicle history records...');
    console.log('='.repeat(80));
    
    // Find records that are marked as successful but have suspicious data
    // (numberOfPreviousKeepers is 0 or undefined, and apiProvider is not CheckCarDetails)
    const incorrectRecords = await VehicleHistory.find({
      $or: [
        { numberOfPreviousKeepers: 0, apiProvider: { $ne: 'CheckCarDetails' } },
        { numberOfPreviousKeepers: { $exists: false } },
        { apiProvider: 'enhanced-vehicle-service' } // Old provider that had issues
      ]
    });
    
    console.log(`\n📊 Found ${incorrectRecords.length} potentially incorrect record(s)`);
    
    if (incorrectRecords.length === 0) {
      console.log('✅ No incorrect records found. Database is clean!');
      return;
    }
    
    console.log('\n📋 Records to be deleted:');
    incorrectRecords.forEach((record, index) => {
      console.log(`\n  ${index + 1}. VRM: ${record.vrm}`);
      console.log(`     Check Date: ${record.checkDate}`);
      console.log(`     Number of Previous Keepers: ${record.numberOfPreviousKeepers}`);
      console.log(`     API Provider: ${record.apiProvider}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🗑️  Deleting incorrect records...');
    
    // Delete the incorrect records
    const result = await VehicleHistory.deleteMany({
      $or: [
        { numberOfPreviousKeepers: 0, apiProvider: { $ne: 'CheckCarDetails' } },
        { numberOfPreviousKeepers: { $exists: false } },
        { apiProvider: 'enhanced-vehicle-service' }
      ]
    });
    
    console.log(`\n✅ Deleted ${result.deletedCount} incorrect record(s)`);
    console.log('💡 Fresh data will be fetched from CheckCarDetails API when needed');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

cleanupIncorrectRecords();
