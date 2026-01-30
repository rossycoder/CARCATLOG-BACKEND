require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get VRM from command line argument
    const vrm = process.argv[2];
    
    if (!vrm) {
      console.log('❌ Please provide a VRM as argument');
      console.log('Usage: node checkAnyVehicleHistory.js HUM777A');
      process.exit(1);
    }
    
    console.log(`🔍 Searching for VRM: ${vrm.toUpperCase()}\n`);
    
    // Find all history records for this VRM
    const histories = await VehicleHistory.find({ 
      vrm: vrm.toUpperCase() 
    }).sort({ checkDate: -1 });
    
    console.log(`📊 Found ${histories.length} history record(s)\n`);
    
    if (histories.length === 0) {
      console.log('⚠️  No history records found in database');
      console.log('💡 Vehicle history needs to be fetched from API');
      process.exit(0);
    }
    
    histories.forEach((history, index) => {
      console.log(`📝 Record ${index + 1}:`);
      console.log(`   Check Date: ${history.checkDate}`);
      console.log(`   VRM: ${history.vrm}`);
      console.log(`   Owners: ${history.numberOfPreviousKeepers || history.previousOwners || history.numberOfOwners || 'N/A'}`);
      console.log(`   Keys: ${history.numberOfKeys || history.keys || 'N/A'}`);
      console.log(`   Service History: ${history.serviceHistory || 'N/A'}`);
      console.log(`   Stolen: ${history.isStolen ? 'Yes' : 'No'}`);
      console.log(`   Written Off: ${history.isWrittenOff ? 'Yes' : 'No'}`);
      console.log(`   Scrapped: ${history.isScrapped ? 'Yes' : 'No'}`);
      console.log(`   Imported: ${history.isImported ? 'Yes' : 'No'}`);
      console.log(`   Exported: ${history.isExported ? 'Yes' : 'No'}`);
      console.log(`   Outstanding Finance: ${history.hasOutstandingFinance ? 'Yes' : 'No'}`);
      console.log(`   Check Status: ${history.checkStatus}`);
      console.log(`   API Provider: ${history.apiProvider}`);
      console.log('');
    });
    
    // Show latest record summary
    const latest = histories[0];
    console.log('📋 Latest Record Summary:');
    console.log(`   ✅ Owners: ${latest.numberOfPreviousKeepers || latest.previousOwners || latest.numberOfOwners || 0}`);
    console.log(`   ✅ Keys: ${latest.numberOfKeys || latest.keys || 1}`);
    console.log(`   ✅ Service History: ${latest.serviceHistory || 'Contact seller'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHistory();
