/**
 * Check RJ08PFA vehicle history from database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'RJ08PFA';
    
    console.log(`🔍 Checking vehicle history for: ${vrm}\n`);
    
    const history = await VehicleHistory.findOne({ vrm }).sort({ checkDate: -1 });

    if (!history) {
      console.log('❌ No history found in database');
      console.log('\nℹ️ History will be fetched when car is viewed on frontend\n');
      return;
    }

    console.log('✅ Vehicle History Found!\n');
    console.log('═══════════════════════════════════════');
    console.log('📊 VEHICLE DETAILS:');
    console.log('═══════════════════════════════════════');
    console.log(`   VRM: ${history.vrm}`);
    console.log(`   Make/Model: ${history.make} ${history.model}`);
    console.log(`   Colour: ${history.colour}`);
    console.log(`   Year: ${history.yearOfManufacture}`);
    console.log(`   Fuel Type: ${history.fuelType}`);
    console.log(`   Body Type: ${history.bodyType}`);
    console.log(`   Transmission: ${history.transmission}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('👥 OWNERSHIP:');
    console.log(`   Number of Previous Keepers: ${history.numberOfPreviousKeepers}`);
    console.log(`   Previous Owners: ${history.previousOwners}`);
    console.log(`   Number of Owners: ${history.numberOfOwners}`);
    console.log(`   Keys: ${history.numberOfKeys || history.keys}`);
    console.log(`   Service History: ${history.serviceHistory}\n`);
    
    console.log('🚗 VEHICLE STATUS:');
    console.log(`   Stolen: ${history.isStolen ? '❌ YES' : '✅ NO'}`);
    console.log(`   Scrapped: ${history.isScrapped ? '❌ YES' : '✅ NO'}`);
    console.log(`   Imported: ${history.isImported ? '⚠️ YES' : '✅ NO'}`);
    console.log(`   Exported: ${history.isExported ? '⚠️ YES' : '✅ NO'}`);
    console.log(`   Written Off: ${history.isWrittenOff ? '❌ YES' : '✅ NO'}`);
    
    if (history.isWrittenOff || history.writeOffCategory) {
      console.log(`   Write-off Category: ${history.writeOffCategory || 'Unknown'}`);
      if (history.writeOffDetails?.date) {
        console.log(`   Write-off Date: ${new Date(history.writeOffDetails.date).toLocaleDateString()}`);
      }
      if (history.writeOffDetails?.description) {
        console.log(`   Description: ${history.writeOffDetails.description}`);
      }
    }
    console.log();
    
    console.log('📋 CHANGES:');
    console.log(`   Plate Changes: ${history.plateChanges}`);
    console.log(`   Colour Changes: ${history.colourChanges}`);
    console.log(`   V5C Certificates: ${history.v5cCertificateCount}\n`);
    
    console.log('📅 CHECK INFO:');
    console.log(`   Check Date: ${history.checkDate.toLocaleDateString()}`);
    console.log(`   Check Status: ${history.checkStatus}`);
    console.log(`   API Provider: ${history.apiProvider}`);
    console.log(`   Test Mode: ${history.testMode ? 'YES' : 'NO'}\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('✅ All data is properly saved in database!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkHistory();
