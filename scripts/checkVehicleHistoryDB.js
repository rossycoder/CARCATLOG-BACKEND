/**
 * Check vehicle history data in database for RJ08PFA
 */

const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
require('dotenv').config();

async function checkHistory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const vrm = 'RJ08PFA';
    
    // Find all history records for this VRM
    const histories = await VehicleHistory.find({ vrm: vrm.toUpperCase() }).sort({ checkDate: -1 });
    
    console.log(`\n📊 Found ${histories.length} history record(s) for VRM: ${vrm}`);
    console.log('='.repeat(80));
    
    if (histories.length === 0) {
      console.log('⚠️  No history records found in database');
      console.log('💡 This means the API call needs to be made to fetch fresh data');
    } else {
      histories.forEach((history, index) => {
        console.log(`\n📝 Record ${index + 1}:`);
        console.log('  Check Date:', history.checkDate);
        console.log('  VRM:', history.vrm);
        console.log('  Number of Previous Keepers:', history.numberOfPreviousKeepers);
        console.log('  Previous Owners:', history.previousOwners);
        console.log('  Number of Owners:', history.numberOfOwners);
        console.log('  Has Accident History:', history.hasAccidentHistory);
        console.log('  Is Written Off:', history.isWrittenOff);
        console.log('  Is Stolen:', history.isStolen);
        console.log('  Has Outstanding Finance:', history.hasOutstandingFinance);
        console.log('  Check Status:', history.checkStatus);
        console.log('  API Provider:', history.apiProvider);
      });
      
      // Check if most recent record has correct data
      const latest = histories[0];
      console.log('\n' + '='.repeat(80));
      if (latest.numberOfPreviousKeepers === 7) {
        console.log('✅ Latest record has correct numberOfPreviousKeepers: 7');
      } else {
        console.log(`❌ Latest record has incorrect numberOfPreviousKeepers: ${latest.numberOfPreviousKeepers}`);
        console.log('💡 Need to delete this record and fetch fresh data from API');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkHistory();
