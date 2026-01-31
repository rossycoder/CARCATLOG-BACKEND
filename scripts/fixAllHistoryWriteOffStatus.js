/**
 * Fix write-off status for all vehicle history records
 * This ensures clean vehicles show as clean (green) not written off (red)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function fixAllHistoryWriteOffStatus() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    console.log('🔍 Finding all vehicle history records...');
    const allHistory = await VehicleHistory.find({});
    console.log(`Found ${allHistory.length} history records\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const history of allHistory) {
      const vrm = history.vrm;
      let needsUpdate = false;
      const updates = {};

      // Check if write-off flags are inconsistent
      const hasWriteOffFlag = history.isWrittenOff === true || history.hasAccidentHistory === true;
      const hasValidCategory = history.writeOffCategory && 
                              history.writeOffCategory !== 'none' && 
                              history.writeOffCategory !== 'unknown' &&
                              history.writeOffCategory.trim() !== '';

      // If no write-off flag but has category, clear the category
      if (!hasWriteOffFlag && hasValidCategory) {
        console.log(`🔧 ${vrm}: Clearing invalid category "${history.writeOffCategory}" (no write-off flag)`);
        updates.writeOffCategory = 'none';
        updates.writeOffDetails = {
          category: 'none',
          date: null,
          description: null
        };
        needsUpdate = true;
      }

      // If has write-off flag but no valid category, clear the flags
      if (hasWriteOffFlag && !hasValidCategory) {
        console.log(`🔧 ${vrm}: Clearing write-off flags (no valid category)`);
        updates.isWrittenOff = false;
        updates.hasAccidentHistory = false;
        updates.accidentDetails = {
          count: 0,
          severity: 'unknown',
          dates: []
        };
        needsUpdate = true;
      }

      // Ensure consistency: if both flags are false, category should be 'none'
      if (!hasWriteOffFlag && history.writeOffCategory !== 'none') {
        console.log(`🔧 ${vrm}: Setting category to 'none' (clean vehicle)`);
        updates.writeOffCategory = 'none';
        updates.writeOffDetails = {
          category: 'none',
          date: null,
          description: null
        };
        needsUpdate = true;
      }

      if (needsUpdate) {
        await VehicleHistory.findByIdAndUpdate(history._id, updates);
        fixedCount++;
        console.log(`   ✅ Fixed ${vrm}\n`);
      } else {
        alreadyCorrectCount++;
      }
    }

    console.log('\n🎉 Fix complete!');
    console.log(`   Fixed: ${fixedCount} records`);
    console.log(`   Already correct: ${alreadyCorrectCount} records`);
    console.log(`   Total: ${allHistory.length} records\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

fixAllHistoryWriteOffStatus();
