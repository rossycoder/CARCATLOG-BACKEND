/**
 * Check Car History Display
 * 
 * This script checks how a specific car's history data is displayed
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCarHistoryDisplay() {
  try {
    console.log('🔍 Checking car history display...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get the most recent car
    const recentCar = await Car.findOne({ advertStatus: 'active' })
      .sort({ createdAt: -1 })
      .populate('historyCheckId');

    if (!recentCar) {
      console.log('❌ No active cars found');
      process.exit(1);
    }

    console.log('📋 Most Recent Car:');
    console.log(`   Make/Model: ${recentCar.make} ${recentCar.model}`);
    console.log(`   Registration: ${recentCar.registrationNumber}`);
    console.log(`   Color: ${recentCar.color}`);
    console.log(`   Created: ${recentCar.createdAt.toLocaleString()}`);
    console.log(`   ID: ${recentCar._id}`);

    console.log('\n📊 History Check Status:');
    console.log(`   Status: ${recentCar.historyCheckStatus || 'Not set'}`);
    console.log(`   Check Date: ${recentCar.historyCheckDate ? recentCar.historyCheckDate.toLocaleString() : 'Not set'}`);
    console.log(`   History Check ID: ${recentCar.historyCheckId ? recentCar.historyCheckId._id || recentCar.historyCheckId : 'Not set'}`);

    if (recentCar.historyCheckId) {
      const history = recentCar.historyCheckId._id ? recentCar.historyCheckId : await VehicleHistory.findById(recentCar.historyCheckId);
      
      if (history) {
        console.log('\n✅ Vehicle History Data:');
        console.log(`   VRM: ${history.vrm}`);
        console.log(`   Check Date: ${history.checkDate.toLocaleString()}`);
        console.log(`   API Provider: ${history.apiProvider}`);
        console.log(`   Test Mode: ${history.testMode}`);
        
        console.log('\n🔍 History Checks:');
        console.log(`   Has Accident History: ${history.hasAccidentHistory}`);
        console.log(`   Is Written Off: ${history.isWrittenOff}`);
        console.log(`   Is Stolen: ${history.isStolen}`);
        console.log(`   Has Outstanding Finance: ${history.hasOutstandingFinance}`);
        console.log(`   Is Scrapped: ${history.isScrapped}`);
        console.log(`   Is Imported: ${history.isImported}`);
        console.log(`   Is Exported: ${history.isExported}`);
        console.log(`   Previous Owners: ${history.previousOwners || history.numberOfOwners || 'Unknown'}`);
        console.log(`   Number of Keys: ${history.numberOfKeys || history.keys || 'Unknown'}`);
        
        if (history.accidentDetails) {
          console.log('\n⚠️  Accident Details:');
          console.log(`   Count: ${history.accidentDetails.count}`);
          console.log(`   Severity: ${history.accidentDetails.severity}`);
          if (history.accidentDetails.dates && history.accidentDetails.dates.length > 0) {
            console.log(`   Dates: ${history.accidentDetails.dates.map(d => new Date(d).toLocaleDateString()).join(', ')}`);
          }
        }
        
        console.log('\n🎯 "Never been written off" Check Result:');
        const isWrittenOff = history.hasAccidentHistory === true || 
                            history.isWrittenOff === true || 
                            (history.accidentDetails?.severity && history.accidentDetails.severity !== 'unknown');
        console.log(`   Should show: ${isWrittenOff ? '❌ RED (Failed)' : '✅ GREEN (Passed)'}`);
        console.log(`   Reason: ${isWrittenOff ? 'Vehicle has accident history or write-off record' : 'No accident history or write-off record'}`);
        
      } else {
        console.log('\n❌ History data not found in database');
      }
    } else {
      console.log('\n⚠️  No history check data linked to this car');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
checkCarHistoryDisplay();
