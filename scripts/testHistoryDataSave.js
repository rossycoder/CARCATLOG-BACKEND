/**
 * Test script to verify vehicle history data is properly saved to database
 * This tests the complete flow: API call -> Parse -> Save to VehicleHistory -> Link to Car
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const EnhancedVehicleService = require('../services/enhancedVehicleService');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

// Test VRM - use a real UK registration
const TEST_VRM = 'RJ08PFA'; // Known test vehicle

async function testHistoryDataSave() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Step 1: Clear any existing history for this VRM
    console.log(`🧹 Clearing existing history for ${TEST_VRM}...`);
    await VehicleHistory.deleteMany({ vrm: TEST_VRM });
    console.log('✅ Cleared existing history\n');

    // Step 2: Call enhanced vehicle service to fetch and save data
    console.log(`📡 Fetching vehicle data for ${TEST_VRM}...`);
    const vehicleData = await EnhancedVehicleService.getEnhancedVehicleData(TEST_VRM, false);
    console.log('✅ Vehicle data fetched\n');

    // Step 3: Check if history was saved
    console.log(`🔍 Checking if history was saved to database...`);
    const savedHistory = await VehicleHistory.findOne({ vrm: TEST_VRM });
    
    if (!savedHistory) {
      console.error('❌ FAILED: History was not saved to database!');
      process.exit(1);
    }
    
    console.log('✅ History found in database\n');

    // Step 4: Verify the data
    console.log('📊 Verifying saved data:');
    console.log(`   VRM: ${savedHistory.vrm}`);
    console.log(`   Make: ${savedHistory.make}`);
    console.log(`   Model: ${savedHistory.model}`);
    console.log(`   Colour: ${savedHistory.colour}`);
    console.log(`   Previous Owners: ${savedHistory.numberOfPreviousKeepers}`);
    console.log(`   Is Written Off: ${savedHistory.isWrittenOff}`);
    console.log(`   Write-off Category: ${savedHistory.writeOffCategory}`);
    console.log(`   Is Stolen: ${savedHistory.isStolen}`);
    console.log(`   Has Finance: ${savedHistory.hasOutstandingFinance}`);
    console.log(`   History ID: ${savedHistory._id}\n`);

    // Step 5: Verify the historyCheckId is in the returned data
    if (vehicleData.historyCheckId) {
      console.log(`✅ History ID is included in returned data: ${vehicleData.historyCheckId}`);
      
      if (vehicleData.historyCheckId.toString() === savedHistory._id.toString()) {
        console.log('✅ History ID matches saved document ID\n');
      } else {
        console.error('❌ FAILED: History ID mismatch!');
        process.exit(1);
      }
    } else {
      console.error('❌ FAILED: History ID not included in returned data!');
      process.exit(1);
    }

    // Step 6: Test creating a car with this history
    console.log(`🚗 Testing car creation with history link...`);
    
    // Delete any existing test car
    await Car.deleteMany({ registrationNumber: TEST_VRM });
    
    const testCar = new Car({
      make: savedHistory.make || 'Test',
      model: savedHistory.model || 'Model',
      year: savedHistory.yearOfManufacture || 2008,
      mileage: 50000,
      price: 5000,
      fuelType: savedHistory.fuelType || 'Petrol',
      transmission: savedHistory.transmission?.toLowerCase() || 'manual',
      color: savedHistory.colour || 'Blue',
      description: 'Test car for history linking',
      postcode: 'SW1A 1AA',
      registrationNumber: TEST_VRM,
      dataSource: 'DVLA',
      historyCheckId: savedHistory._id,
      historyCheckStatus: 'verified',
      historyCheckDate: new Date(),
      advertStatus: 'draft'
    });
    
    await testCar.save();
    console.log(`✅ Test car created with ID: ${testCar._id}\n`);

    // Step 7: Verify the link
    console.log(`🔗 Verifying car-history link...`);
    const carWithHistory = await Car.findById(testCar._id).populate('historyCheckId');
    
    if (!carWithHistory.historyCheckId) {
      console.error('❌ FAILED: Car does not have historyCheckId!');
      process.exit(1);
    }
    
    console.log('✅ Car has historyCheckId\n');
    
    if (carWithHistory.historyCheckId._id.toString() === savedHistory._id.toString()) {
      console.log('✅ Car is properly linked to history document\n');
    } else {
      console.error('❌ FAILED: Car history link is incorrect!');
      process.exit(1);
    }

    // Step 8: Display the linked history data
    console.log('📋 Linked history data:');
    console.log(`   Owners: ${carWithHistory.historyCheckId.numberOfPreviousKeepers}`);
    console.log(`   Write-off: ${carWithHistory.historyCheckId.isWrittenOff}`);
    console.log(`   Category: ${carWithHistory.historyCheckId.writeOffCategory}`);
    console.log(`   Stolen: ${carWithHistory.historyCheckId.isStolen}`);
    console.log(`   Finance: ${carWithHistory.historyCheckId.hasOutstandingFinance}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await Car.deleteOne({ _id: testCar._id });
    console.log('✅ Test car deleted\n');

    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Vehicle history data is properly saved to database');
    console.log('✅ History ID is returned in vehicle data');
    console.log('✅ Cars can be linked to history documents');
    console.log('✅ History data is accessible through car documents\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testHistoryDataSave();
