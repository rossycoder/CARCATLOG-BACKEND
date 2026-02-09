/**
 * Complete end-to-end test for write-off category fix
 * Tests the entire flow from API response -> parsing -> database storage
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { parseHistoryResponse } = require('./utils/historyResponseParser');
const VehicleHistory = require('./models/VehicleHistory');

// Mock API response with Category N write-off
const mockApiResponse = {
  VehicleRegistration: {
    Vrm: 'TEST123',
    Make: 'VOLKSWAGEN',
    Model: 'GOLF',
    Scrapped: false,
    Imported: false,
    Exported: false
  },
  VehicleHistory: {
    NumberOfPreviousKeepers: 2,
    writeOffRecord: true,
    writeoff: {
      category: 'N',
      status: 'CAT N VEHICLE DAMAGED',
      lossdate: '2020-05-15'
    },
    stolenRecord: false,
    financeRecord: false,
    V5CCertificateCount: 1,
    PlateChangeCount: 0,
    ColourChangeCount: 0,
    VicCount: 0
  }
};

async function testCompleteFlow() {
  console.log('='.repeat(60));
  console.log('WRITE-OFF CATEGORY FIX - COMPLETE FLOW TEST');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Connect to database
    console.log('Step 1: Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autotrader', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database');
    console.log();

    // Step 2: Parse API response
    console.log('Step 2: Parsing API response...');
    console.log('Mock API writeoff data:', JSON.stringify(mockApiResponse.VehicleHistory.writeoff, null, 2));
    const parsedResult = parseHistoryResponse(mockApiResponse, false);
    console.log('✅ Parsed successfully');
    console.log('   writeOffCategory:', parsedResult.writeOffCategory);
    console.log('   isWrittenOff:', parsedResult.isWrittenOff);
    console.log('   writeOffDetails:', JSON.stringify(parsedResult.writeOffDetails, null, 2));
    console.log();

    // Step 3: Save to database
    console.log('Step 3: Saving to database...');
    
    // Delete existing test records
    await VehicleHistory.deleteMany({ vrm: 'TEST123' });
    console.log('   Cleaned up existing test records');
    
    // Create new record
    const historyData = {
      vrm: 'TEST123',
      make: 'VOLKSWAGEN',
      model: 'GOLF',
      checkDate: new Date(),
      hasAccidentHistory: parsedResult.hasAccidentHistory,
      isStolen: parsedResult.isStolen,
      hasOutstandingFinance: parsedResult.hasOutstandingFinance,
      isWrittenOff: parsedResult.isWrittenOff,
      writeOffCategory: parsedResult.writeOffCategory,
      writeOffDetails: parsedResult.writeOffDetails,
      accidentDetails: parsedResult.accidentDetails,
      numberOfPreviousKeepers: parsedResult.numberOfPreviousKeepers,
      checkStatus: 'success',
      apiProvider: 'CheckCarDetails',
      testMode: false,
    };
    
    const historyDoc = new VehicleHistory(historyData);
    await historyDoc.save();
    console.log('✅ Saved to database');
    console.log();

    // Step 4: Retrieve from database and verify
    console.log('Step 4: Retrieving from database...');
    const retrieved = await VehicleHistory.findOne({ vrm: 'TEST123' });
    console.log('✅ Retrieved successfully');
    console.log('   writeOffCategory:', retrieved.writeOffCategory);
    console.log('   isWrittenOff:', retrieved.isWrittenOff);
    console.log('   writeOffDetails.category:', retrieved.writeOffDetails.category);
    console.log();

    // Step 5: Verify correctness
    console.log('Step 5: Verifying data integrity...');
    console.log('='.repeat(60));
    
    let allPassed = true;
    
    if (retrieved.writeOffCategory === 'N') {
      console.log('✅ PASS: writeOffCategory is "N"');
    } else {
      console.log(`❌ FAIL: writeOffCategory is "${retrieved.writeOffCategory}" (expected "N")`);
      allPassed = false;
    }
    
    if (retrieved.isWrittenOff === true) {
      console.log('✅ PASS: isWrittenOff is true');
    } else {
      console.log('❌ FAIL: isWrittenOff is false (expected true)');
      allPassed = false;
    }
    
    if (retrieved.writeOffDetails.category === 'N') {
      console.log('✅ PASS: writeOffDetails.category is "N"');
    } else {
      console.log(`❌ FAIL: writeOffDetails.category is "${retrieved.writeOffDetails.category}" (expected "N")`);
      allPassed = false;
    }
    
    if (retrieved.accidentDetails.severity === 'N') {
      console.log('✅ PASS: accidentDetails.severity is "N"');
    } else {
      console.log(`❌ FAIL: accidentDetails.severity is "${retrieved.accidentDetails.severity}" (expected "N")`);
      allPassed = false;
    }
    
    console.log('='.repeat(60));
    console.log();
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Write-off category fix is working correctly.');
    } else {
      console.log('⚠️  SOME TESTS FAILED. Please review the output above.');
    }
    
    // Cleanup
    console.log();
    console.log('Cleaning up test data...');
    await VehicleHistory.deleteMany({ vrm: 'TEST123' });
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log();
    console.log('Database connection closed');
  }
}

// Run the test
testCompleteFlow();
