/**
 * Debug CX18NBG vehicle history - Check API response and database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryService = require('../services/historyService');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'CX18NBG';
    
    // Step 1: Check what's in database
    console.log('═══════════════════════════════════════');
    console.log('STEP 1: Check Database');
    console.log('═══════════════════════════════════════\n');
    
    const dbHistory = await VehicleHistory.findOne({ vrm }).sort({ checkDate: -1 });
    
    if (dbHistory) {
      console.log('✅ Found in database:');
      console.log(`   numberOfPreviousKeepers: ${dbHistory.numberOfPreviousKeepers}`);
      console.log(`   previousOwners: ${dbHistory.previousOwners}`);
      console.log(`   numberOfOwners: ${dbHistory.numberOfOwners}`);
      console.log(`   Check Date: ${dbHistory.checkDate.toLocaleString()}`);
      console.log(`   API Provider: ${dbHistory.apiProvider}\n`);
    } else {
      console.log('❌ NOT found in database\n');
    }
    
    // Step 2: Fetch fresh data from API
    console.log('═══════════════════════════════════════');
    console.log('STEP 2: Fetch Fresh Data from API');
    console.log('═══════════════════════════════════════\n');
    
    const historyService = new HistoryService();
    
    try {
      const apiResult = await historyService.checkVehicleHistory(vrm, true); // Force refresh
      
      console.log('✅ API Response:');
      console.log(`   numberOfPreviousKeepers: ${apiResult.numberOfPreviousKeepers}`);
      console.log(`   previousOwners: ${apiResult.previousOwners}`);
      console.log(`   numberOfOwners: ${apiResult.numberOfOwners}`);
      console.log(`   Make/Model: ${apiResult.make} ${apiResult.model}`);
      console.log(`   Colour: ${apiResult.colour}`);
      console.log(`   Year: ${apiResult.yearOfManufacture}\n`);
      
      // Step 3: Check what was saved
      console.log('═══════════════════════════════════════');
      console.log('STEP 3: Verify What Was Saved');
      console.log('═══════════════════════════════════════\n');
      
      const newDbHistory = await VehicleHistory.findOne({ vrm }).sort({ checkDate: -1 });
      
      console.log('✅ Now in database:');
      console.log(`   numberOfPreviousKeepers: ${newDbHistory.numberOfPreviousKeepers}`);
      console.log(`   previousOwners: ${newDbHistory.previousOwners}`);
      console.log(`   numberOfOwners: ${newDbHistory.numberOfOwners}\n`);
      
      // Step 4: Analysis
      console.log('═══════════════════════════════════════');
      console.log('ANALYSIS');
      console.log('═══════════════════════════════════════\n');
      
      if (newDbHistory.numberOfPreviousKeepers === 0 && 
          newDbHistory.previousOwners === 0 && 
          newDbHistory.numberOfOwners === 0) {
        console.log('❌ PROBLEM: All owner fields are 0!');
        console.log('   This means API is returning 0 or null for owner data\n');
        console.log('🔍 Raw API response structure needed for debugging');
      } else {
        console.log('✅ Owner data is being saved correctly!');
        console.log(`   Owners: ${newDbHistory.numberOfPreviousKeepers}\n`);
      }
      
    } catch (apiError) {
      console.error('❌ API Error:', apiError.message);
      console.error('   This might be a daily limit issue or API problem\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

debug();
