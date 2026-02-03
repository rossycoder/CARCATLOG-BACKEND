require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function cleanupDuplicateVehicleHistory() {
  try {
    console.log('🔍 Cleaning up duplicate VehicleHistory records');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all VehicleHistory records
    const allRecords = await VehicleHistory.find({}).sort({ vrm: 1, checkDate: -1 });
    console.log(`📊 Total VehicleHistory records found: ${allRecords.length}`);
    
    // Group by VRM to find duplicates
    const vrmGroups = {};
    allRecords.forEach(record => {
      if (!vrmGroups[record.vrm]) {
        vrmGroups[record.vrm] = [];
      }
      vrmGroups[record.vrm].push(record);
    });
    
    console.log(`📊 Unique VRMs: ${Object.keys(vrmGroups).length}`);
    
    // Find duplicates
    const duplicates = {};
    let totalDuplicates = 0;
    
    Object.entries(vrmGroups).forEach(([vrm, records]) => {
      if (records.length > 1) {
        duplicates[vrm] = records;
        totalDuplicates += records.length - 1; // Keep 1, delete the rest
      }
    });
    
    console.log(`\n🔍 Duplicate Analysis:`);
    console.log(`   VRMs with duplicates: ${Object.keys(duplicates).length}`);
    console.log(`   Total duplicate records to delete: ${totalDuplicates}`);
    
    if (Object.keys(duplicates).length === 0) {
      console.log('\n✅ No duplicates found! Database is clean.');
      return;
    }
    
    console.log('\n📋 Duplicate Details:');
    Object.entries(duplicates).forEach(([vrm, records]) => {
      console.log(`\n   VRM: ${vrm} (${records.length} records)`);
      records.forEach((record, index) => {
        console.log(`     ${index + 1}. ID: ${record._id}, Date: ${record.checkDate}, Provider: ${record.apiProvider || 'unknown'}`);
      });
    });
    
    // Clean up duplicates - keep the most recent record for each VRM
    let deletedCount = 0;
    
    for (const [vrm, records] of Object.entries(duplicates)) {
      // Sort by checkDate descending (most recent first)
      records.sort((a, b) => new Date(b.checkDate) - new Date(a.checkDate));
      
      // Keep the first (most recent) record, delete the rest
      const toKeep = records[0];
      const toDelete = records.slice(1);
      
      console.log(`\n🔧 Cleaning VRM: ${vrm}`);
      console.log(`   Keeping: ${toKeep._id} (${toKeep.checkDate})`);
      console.log(`   Deleting: ${toDelete.length} older records`);
      
      // Delete the duplicate records
      for (const record of toDelete) {
        await VehicleHistory.findByIdAndDelete(record._id);
        deletedCount++;
        console.log(`   ✅ Deleted: ${record._id}`);
      }
    }
    
    console.log(`\n🎯 CLEANUP COMPLETE:`);
    console.log(`   Records deleted: ${deletedCount}`);
    console.log(`   Unique VRMs remaining: ${Object.keys(vrmGroups).length}`);
    console.log(`   ✅ Each VRM now has exactly 1 VehicleHistory record`);
    
    // Verify cleanup
    const finalCount = await VehicleHistory.countDocuments();
    const uniqueVrms = await VehicleHistory.distinct('vrm');
    
    console.log(`\n📊 Final Verification:`);
    console.log(`   Total VehicleHistory records: ${finalCount}`);
    console.log(`   Unique VRMs: ${uniqueVrms.length}`);
    
    if (finalCount === uniqueVrms.length) {
      console.log(`   ✅ SUCCESS: 1 record per VRM (${finalCount} records for ${uniqueVrms.length} VRMs)`);
    } else {
      console.log(`   ⚠️  WARNING: Still have duplicates (${finalCount} records for ${uniqueVrms.length} VRMs)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanupDuplicateVehicleHistory();