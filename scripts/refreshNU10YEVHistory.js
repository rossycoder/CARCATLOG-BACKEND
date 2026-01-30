/**
 * Refresh vehicle history for NU10YEV
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const HistoryService = require('../services/historyService');
const VehicleHistory = require('../models/VehicleHistory');

async function refreshHistory() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'NU10YEV';
    
    // Delete existing history for this VRM
    console.log(`Deleting existing history for ${vrm}...`);
    const deleteResult = await VehicleHistory.deleteMany({ vrm: vrm });
    console.log(`Deleted ${deleteResult.deletedCount} existing records\n`);

    // Fetch fresh history
    console.log(`Fetching fresh history for ${vrm}...`);
    const historyService = new HistoryService();
    const history = await historyService.checkVehicleHistory(vrm, true);

    console.log('\n✅ History fetched and saved successfully!\n');
    console.log('📊 Saved Data:');
    console.log('  VRM:', history.vrm);
    console.log('  Number of Previous Keepers:', history.numberOfPreviousKeepers);
    console.log('  V5C Certificate Count:', history.v5cCertificateCount);
    console.log('  V5C Certificate List:', history.v5cCertificateList);
    console.log('  Plate Changes:', history.plateChanges);
    console.log('  Colour Changes:', history.colourChanges);
    console.log('  Colour Change Details:', history.colourChangeDetails);
    console.log('  Keeper Changes List Length:', history.keeperChangesList?.length || 0);
    console.log('  VIC Count:', history.vicCount);
    
    // Verify in database
    console.log('\n🔍 Verifying in database...');
    const dbRecord = await VehicleHistory.findOne({ vrm: vrm }).lean();
    
    if (dbRecord) {
      console.log('✅ Record found in database');
      console.log('  DB Number of Previous Keepers:', dbRecord.numberOfPreviousKeepers);
      console.log('  DB V5C Certificate Count:', dbRecord.v5cCertificateCount);
      console.log('  DB Keeper Changes List Length:', dbRecord.keeperChangesList?.length || 0);
      
      if (dbRecord.numberOfPreviousKeepers === 7) {
        console.log('\n✅ SUCCESS: Owner count is correctly stored as 7');
      } else {
        console.log('\n❌ ERROR: Owner count is incorrect in database:', dbRecord.numberOfPreviousKeepers);
      }
    } else {
      console.log('❌ Record not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

refreshHistory();
