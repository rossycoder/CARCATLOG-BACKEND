/**
 * Test EX09MYY History
 * 
 * This script tests what history data is returned for EX09MYY
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const HistoryService = require('../services/historyService');
const VehicleHistory = require('../models/VehicleHistory');

const historyService = new HistoryService();

async function testEX09MYYHistory() {
  try {
    console.log('🔍 Testing EX09MYY history data...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const vrm = 'EX09MYY';

    // Check cached history first
    console.log('📋 Checking cached history...');
    const cachedHistory = await VehicleHistory.findOne({ vrm }).sort({ checkDate: -1 });
    
    if (cachedHistory) {
      console.log('✓ Found cached history:');
      console.log(`   Check Date: ${cachedHistory.checkDate.toLocaleString()}`);
      console.log(`   Written Off: ${cachedHistory.isWrittenOff ? 'YES' : 'NO'}`);
      console.log(`   Has Accident History: ${cachedHistory.hasAccidentHistory ? 'YES' : 'NO'}`);
      if (cachedHistory.accidentDetails) {
        console.log(`   Accident Severity: ${cachedHistory.accidentDetails.severity}`);
        console.log(`   Accident Count: ${cachedHistory.accidentDetails.count}`);
        if (cachedHistory.accidentDetails.dates && cachedHistory.accidentDetails.dates.length > 0) {
          console.log(`   Accident Dates: ${cachedHistory.accidentDetails.dates.map(d => new Date(d).toLocaleDateString()).join(', ')}`);
        }
      }
      console.log(`   Previous Owners: ${cachedHistory.previousOwners || 'Unknown'}`);
    } else {
      console.log('⚠️  No cached history found');
    }

    // Fetch fresh history from API
    console.log('\n📡 Fetching fresh history from API...');
    const freshHistory = await historyService.checkVehicleHistory(vrm, true); // Force refresh

    console.log('\n✅ Fresh API Response:');
    console.log(`   VRM: ${freshHistory.vrm}`);
    console.log(`   Check Date: ${freshHistory.checkDate ? new Date(freshHistory.checkDate).toLocaleString() : 'N/A'}`);
    console.log(`   API Provider: ${freshHistory.apiProvider}`);
    console.log(`   Test Mode: ${freshHistory.testMode}`);
    console.log(`   Written Off: ${freshHistory.isWrittenOff ? 'YES' : 'NO'}`);
    console.log(`   Has Accident History: ${freshHistory.hasAccidentHistory ? 'YES' : 'NO'}`);
    
    if (freshHistory.accidentDetails) {
      console.log('\n⚠️  Accident Details:');
      console.log(`   Count: ${freshHistory.accidentDetails.count}`);
      console.log(`   Severity: ${freshHistory.accidentDetails.severity}`);
      if (freshHistory.accidentDetails.dates && freshHistory.accidentDetails.dates.length > 0) {
        console.log(`   Dates: ${freshHistory.accidentDetails.dates.map(d => new Date(d).toLocaleDateString()).join(', ')}`);
      }
    }

    console.log(`\n   Previous Owners: ${freshHistory.previousOwners || freshHistory.numberOfOwners || 'Unknown'}`);
    console.log(`   Is Stolen: ${freshHistory.isStolen ? 'YES' : 'NO'}`);
    console.log(`   Has Outstanding Finance: ${freshHistory.hasOutstandingFinance ? 'YES' : 'NO'}`);
    console.log(`   Is Scrapped: ${freshHistory.isScrapped ? 'YES' : 'NO'}`);
    console.log(`   Is Imported: ${freshHistory.isImported ? 'YES' : 'NO'}`);
    console.log(`   Is Exported: ${freshHistory.isExported ? 'YES' : 'NO'}`);

    console.log('\n🎯 Display Logic Result:');
    const shouldShowRed = freshHistory.hasAccidentHistory === true || 
                         freshHistory.isWrittenOff === true || 
                         (freshHistory.accidentDetails?.severity && freshHistory.accidentDetails.severity !== 'unknown');
    
    console.log(`   "Never been written off" should show: ${shouldShowRed ? '❌ RED (Failed)' : '✅ GREEN (Passed)'}`);
    console.log(`   Reason: ${shouldShowRed ? 'Vehicle has write-off or accident history' : 'No write-off or accident history'}`);

    console.log('\n💡 Explanation:');
    console.log('   This is the REAL vehicle history for registration EX09MYY.');
    console.log('   The CheckCarDetails API returns actual DVLA/insurance records.');
    console.log('   If this vehicle was written off in the past, it will always show that.');
    console.log('   To test with a "clean" vehicle, use a different registration number.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
testEX09MYYHistory();
