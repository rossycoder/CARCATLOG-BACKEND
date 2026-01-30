require('dotenv').config();
const mongoose = require('mongoose');
const HistoryService = require('../services/historyService');

/**
 * Test script to verify that history check works correctly for new cars
 * This simulates what happens when a new car is added
 */
async function testHistoryForNewCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test with a real registration number
    const testVRM = 'NU10YEV';
    
    console.log('=== Testing History Check for New Car ===');
    console.log(`VRM: ${testVRM}\n`);
    
    // Initialize history service (same as Car model does)
    const historyService = new HistoryService();
    
    console.log('🔍 Performing history check (simulating new car save)...\n');
    
    // Perform history check (force refresh to get fresh data)
    const historyResult = await historyService.checkVehicleHistory(testVRM, true);
    
    console.log('=== History Check Result ===');
    console.log('✅ Check Status:', historyResult.checkStatus);
    console.log('📊 API Provider:', historyResult.apiProvider);
    console.log('📅 Check Date:', historyResult.checkDate);
    console.log('\n=== Owner Information ===');
    console.log('👥 Number of Previous Keepers:', historyResult.numberOfPreviousKeepers);
    console.log('👥 Previous Owners:', historyResult.previousOwners);
    console.log('👥 Number of Owners:', historyResult.numberOfOwners);
    console.log('🔑 Number of Keys:', historyResult.numberOfKeys);
    console.log('📋 Service History:', historyResult.serviceHistory);
    console.log('\n=== Additional History Data ===');
    console.log('📜 V5C Certificate Count:', historyResult.v5cCertificateCount);
    console.log('🔄 Plate Changes:', historyResult.plateChanges);
    console.log('🎨 Colour Changes:', historyResult.colourChanges);
    console.log('🔍 VIC Count:', historyResult.vicCount);
    console.log('📝 Keeper Changes List:', historyResult.keeperChangesList?.length || 0, 'entries');
    console.log('\n=== Safety Checks ===');
    console.log('🚨 Is Stolen:', historyResult.isStolen);
    console.log('💥 Is Written Off:', historyResult.isWrittenOff);
    console.log('🚗 Has Accident History:', historyResult.hasAccidentHistory);
    console.log('💰 Has Outstanding Finance:', historyResult.hasOutstandingFinance);
    console.log('🗑️  Is Scrapped:', historyResult.isScrapped);
    console.log('🌍 Is Imported:', historyResult.isImported);
    console.log('✈️  Is Exported:', historyResult.isExported);
    
    // Verify critical fields
    console.log('\n=== Verification ===');
    const issues = [];
    
    if (historyResult.numberOfPreviousKeepers === undefined || historyResult.numberOfPreviousKeepers === null) {
      issues.push('❌ numberOfPreviousKeepers is missing');
    } else if (historyResult.numberOfPreviousKeepers === 0) {
      issues.push('⚠️  numberOfPreviousKeepers is 0 (might be incorrect for used cars)');
    } else {
      console.log('✅ numberOfPreviousKeepers is set correctly:', historyResult.numberOfPreviousKeepers);
    }
    
    if (historyResult.previousOwners === undefined || historyResult.previousOwners === null) {
      issues.push('❌ previousOwners is missing');
    } else {
      console.log('✅ previousOwners is set correctly:', historyResult.previousOwners);
    }
    
    if (historyResult.numberOfOwners === undefined || historyResult.numberOfOwners === null) {
      issues.push('❌ numberOfOwners is missing');
    } else {
      console.log('✅ numberOfOwners is set correctly:', historyResult.numberOfOwners);
    }
    
    if (historyResult.apiProvider !== 'CheckCarDetails') {
      issues.push(`⚠️  API Provider is "${historyResult.apiProvider}" (expected "CheckCarDetails")`);
    } else {
      console.log('✅ API Provider is correct:', historyResult.apiProvider);
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      issues.forEach(issue => console.log('  ', issue));
    } else {
      console.log('\n✅ All checks passed! History data is correct.');
    }
    
    console.log('\n=== Summary ===');
    console.log('This is the data that will be saved when a new car is added.');
    console.log('The Car model pre-save hook will call historyService.checkVehicleHistory()');
    console.log('and store this exact data in the VehicleHistory collection.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testHistoryForNewCar();
