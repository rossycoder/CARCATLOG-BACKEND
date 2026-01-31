/**
 * Clean up duplicate vehicle history entries
 * Keep only the most recent entry for each VRM
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function cleanDuplicateHistory() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all VRMs with multiple history records
    console.log('🔍 Finding duplicate history entries...');
    const duplicates = await VehicleHistory.aggregate([
      {
        $group: {
          _id: '$vrm',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          dates: { $push: '$checkDate' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`Found ${duplicates.length} VRMs with duplicate entries\n`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    let totalDeleted = 0;

    for (const dup of duplicates) {
      const vrm = dup._id;
      const count = dup.count;
      
      console.log(`📋 Processing ${vrm} (${count} entries)...`);

      // Get all records for this VRM, sorted by date (newest first)
      const records = await VehicleHistory.find({ vrm })
        .sort({ checkDate: -1 })
        .exec();

      // Keep the first (newest) record
      const keepRecord = records[0];
      console.log(`   ✅ Keeping: ${keepRecord._id} (${keepRecord.checkDate})`);

      // Delete all other records
      const deleteIds = records.slice(1).map(r => r._id);
      
      if (deleteIds.length > 0) {
        const deleteResult = await VehicleHistory.deleteMany({
          _id: { $in: deleteIds }
        });
        
        console.log(`   🗑️  Deleted ${deleteResult.deletedCount} old entries`);
        totalDeleted += deleteResult.deletedCount;
      }
    }

    console.log(`\n🎉 Cleanup complete!`);
    console.log(`   Total duplicates removed: ${totalDeleted}`);
    console.log(`   Unique VRMs cleaned: ${duplicates.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the cleanup
cleanDuplicateHistory();
