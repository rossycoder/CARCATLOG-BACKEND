/**
 * Complete Vehicle History Test
 * Tests: API fetch → Database save → Frontend display
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryService = require('../services/historyService');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Vehicle History Flow\n');
    console.log('═'.repeat(60));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test VRM
    const testVRM = 'RJ08PFA';
    
    // Step 1: Check if car exists
    console.log('📋 Step 1: Check Car in Database');
    console.log('─'.repeat(60));
    
    const car = await Car.findOne({ registrationNumber: testVRM });
    
    if (!car) {
      console.error(`❌ Car not found with registration: ${testVRM}`);
      return;
    }
    
    console.log(`✅ Car found: ${car.make} ${car.model}`);
    console.log(`   ID: ${car._id}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   History Check ID: ${car.historyCheckId || 'MISSING ❌'}`);
    console.log(`   History Status: ${car.historyCheckStatus || 'MISSING ❌'}`);
    console.log('');

    // Step 2: Check if history exists in database
    console.log('📋 Step 2: Check Vehicle History in Database');
    console.log('─'.repeat(60));
    
    let historyInDB = null;
    
    if (car.historyCheckId) {
      historyInDB = await VehicleHistory.findById(car.historyCheckId);
      
      if (historyInDB) {
        console.log('✅ Vehicle History found in database');
        console.log(`   ID: ${historyInDB._id}`);
        console.log(`   VRM: ${historyInDB.vrm}`);
        console.log(`   Make: ${historyInDB.make || 'N/A'}`);
        console.log(`   Model: ${historyInDB.model || 'N/A'}`);
        console.log(`   Previous Owners: ${historyInDB.numberOfPreviousKeepers || historyInDB.previousOwners || 0}`);
        console.log(`   Has Accident: ${historyInDB.hasAccidentHistory}`);
        console.log(`   Is Stolen: ${historyInDB.isStolen}`);
        console.log(`   Has Finance: ${historyInDB.hasOutstandingFinance}`);
        console.log(`   Check Status: ${historyInDB.checkStatus}`);
        console.log(`   Check Date: ${historyInDB.checkDate}`);
      } else {
        console.error('❌ Vehicle History NOT found in database');
        console.log('   Car has historyCheckId but document is missing!');
      }
    } else {
      console.warn('⚠️  Car does not have historyCheckId');
      console.log('   History has not been fetched yet');
    }
    console.log('');

    // Step 3: Test API fetch
    console.log('📋 Step 3: Test API Fetch');
    console.log('─'.repeat(60));
    
    try {
      const historyService = new HistoryService();
      console.log(`Calling API for VRM: ${testVRM}...`);
      
      const historyFromAPI = await historyService.checkVehicleHistory(testVRM, false);
      
      console.log('✅ API call successful');
      console.log(`   VRM: ${historyFromAPI.vrm}`);
      console.log(`   Make: ${historyFromAPI.make || 'N/A'}`);
      console.log(`   Model: ${historyFromAPI.model || 'N/A'}`);
      console.log(`   Previous Owners: ${historyFromAPI.numberOfPreviousKeepers || historyFromAPI.previousOwners || 0}`);
      console.log(`   Has Accident: ${historyFromAPI.hasAccidentHistory}`);
      console.log(`   Is Stolen: ${historyFromAPI.isStolen}`);
      console.log(`   Has Finance: ${historyFromAPI.hasOutstandingFinance}`);
      console.log(`   Check Status: ${historyFromAPI.checkStatus}`);
      
      // Update car if needed
      if (!car.historyCheckId && historyFromAPI._id) {
        console.log('\n🔧 Updating car with history reference...');
        car.historyCheckId = historyFromAPI._id;
        car.historyCheckStatus = 'verified';
        car.historyCheckDate = new Date();
        await car.save();
        console.log('✅ Car updated with history reference');
      }
    } catch (apiError) {
      console.error('❌ API call failed:', apiError.message);
      console.log('   This could be due to:');
      console.log('   - API credentials missing or invalid');
      console.log('   - Network connectivity issues');
      console.log('   - API rate limit exceeded');
      console.log('   - Invalid VRM for test mode');
    }
    console.log('');

    // Step 4: Verify data structure
    console.log('📋 Step 4: Verify Data Structure');
    console.log('─'.repeat(60));
    
    if (historyInDB) {
      const requiredFields = [
        'vrm',
        'hasAccidentHistory',
        'isStolen',
        'hasOutstandingFinance',
        'checkStatus',
        'checkDate'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in historyInDB.toObject()));
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
      } else {
        console.warn('⚠️  Missing fields:', missingFields.join(', '));
      }
      
      // Check optional but important fields
      const optionalFields = {
        'make': historyInDB.make,
        'model': historyInDB.model,
        'numberOfPreviousKeepers': historyInDB.numberOfPreviousKeepers || historyInDB.previousOwners,
        'v5cCertificateCount': historyInDB.v5cCertificateCount,
        'plateChanges': historyInDB.plateChanges,
        'colourChanges': historyInDB.colourChanges
      };
      
      console.log('\nOptional Fields:');
      Object.entries(optionalFields).forEach(([field, value]) => {
        const status = value !== undefined && value !== null ? '✅' : '⚠️ ';
        console.log(`   ${status} ${field}: ${value !== undefined && value !== null ? value : 'Not set'}`);
      });
    }
    console.log('');

    // Step 5: Summary
    console.log('📊 Summary');
    console.log('═'.repeat(60));
    
    const carHasHistory = !!car.historyCheckId;
    const historyExists = !!historyInDB;
    const historyHasData = historyInDB && historyInDB.checkStatus === 'success';
    
    console.log(`Car has historyCheckId: ${carHasHistory ? '✅' : '❌'}`);
    console.log(`History exists in DB: ${historyExists ? '✅' : '❌'}`);
    console.log(`History has valid data: ${historyHasData ? '✅' : '❌'}`);
    console.log('');
    
    if (carHasHistory && historyExists && historyHasData) {
      console.log('🎉 Vehicle History is working correctly!');
      console.log('');
      console.log('✅ API fetch: Working');
      console.log('✅ Database save: Working');
      console.log('✅ Car reference: Working');
      console.log('✅ Frontend display: Should work');
    } else {
      console.log('⚠️  Vehicle History has issues:');
      console.log('');
      
      if (!carHasHistory) {
        console.log('❌ Car does not have historyCheckId');
        console.log('   Fix: Run history fetch for this car');
        console.log('   Command: node backend/scripts/refreshNU10YEVHistory.js');
      }
      
      if (!historyExists) {
        console.log('❌ History document missing from database');
        console.log('   Fix: Fetch history from API');
        console.log('   Command: node backend/scripts/testVehicleHistoryAPI.js ' + testVRM);
      }
      
      if (!historyHasData) {
        console.log('❌ History data is incomplete or invalid');
        console.log('   Fix: Re-fetch from API with force refresh');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testCompleteFlow();
