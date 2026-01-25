/**
 * Check Specific History Record
 * 
 * Checks the history record ID: 6974103912b3f5108cd87b53
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const VehicleHistory = require('../models/VehicleHistory');

async function checkSpecificHistoryRecord() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const historyId = '6974103912b3f5108cd87b53';
    
    console.log(`🔍 Looking for history record: ${historyId}\n`);
    
    const history = await VehicleHistory.findById(historyId);
    
    if (!history) {
      console.log('❌ History record NOT FOUND');
      console.log('\nThis means the car is pointing to a deleted/non-existent history record.');
      console.log('This is why it might show as "clear" - no history data to check!');
    } else {
      console.log('✅ History record FOUND:');
      console.log(`   VRM: ${history.vrm}`);
      console.log(`   Check Date: ${history.checkDate.toLocaleString()}`);
      console.log(`   API Provider: ${history.apiProvider}`);
      console.log(`   Test Mode: ${history.testMode}`);
      console.log(`   Written Off: ${history.isWrittenOff ? 'YES' : 'NO'}`);
      console.log(`   Has Accident History: ${history.hasAccidentHistory ? 'YES' : 'NO'}`);
      
      if (history.accidentDetails) {
        console.log('\n⚠️  Accident Details:');
        console.log(`   Count: ${history.accidentDetails.count}`);
        console.log(`   Severity: ${history.accidentDetails.severity}`);
        if (history.accidentDetails.dates && history.accidentDetails.dates.length > 0) {
          console.log(`   Dates: ${history.accidentDetails.dates.map(d => new Date(d).toLocaleDateString()).join(', ')}`);
        }
      }
      
      console.log(`\n   Previous Owners: ${history.previousOwners || history.numberOfOwners || 'Unknown'}`);
      console.log(`   Is Stolen: ${history.isStolen ? 'YES' : 'NO'}`);
      console.log(`   Has Outstanding Finance: ${history.hasOutstandingFinance ? 'YES' : 'NO'}`);
      
      console.log('\n🎯 Display Result:');
      const shouldShowRed = history.hasAccidentHistory === true || 
                           history.isWrittenOff === true || 
                           (history.accidentDetails?.severity && history.accidentDetails.severity !== 'unknown');
      
      console.log(`   "Never been written off" will show: ${shouldShowRed ? '❌ RED (Failed)' : '✅ GREEN (Passed)'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

checkSpecificHistoryRecord();
