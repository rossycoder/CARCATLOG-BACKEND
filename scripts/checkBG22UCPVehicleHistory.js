#!/usr/bin/env node

/**
 * Check BG22UCP Vehicle History API Response
 * 
 * This script checks if the vehicle history is correctly displayed via API
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkVehicleHistoryAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    // Find the BG22UCP car
    const car = await Car.findOne({ registrationNumber: 'BG22UCP' }).populate('historyCheckId');
    if (!car) {
      console.log('❌ Car BG22UCP not found');
      return;
    }

    console.log('🚗 Found car:', {
      id: car._id,
      registration: car.registrationNumber,
      advertId: car.advertId,
      historyCheckId: car.historyCheckId?._id,
      historyCheckStatus: car.historyCheckStatus
    });

    // Check if history is populated
    if (car.historyCheckId) {
      console.log('\n📋 Vehicle History Data:');
      console.log('   History ID:', car.historyCheckId._id);
      console.log('   Check Date:', car.historyCheckId.checkDate);
      console.log('   Make/Model:', car.historyCheckId.make, car.historyCheckId.model);
      console.log('   Previous Owners:', car.historyCheckId.previousOwners);
      console.log('   Keys:', car.historyCheckId.keys);
      
      console.log('\n🔍 Write-off Status:');
      console.log('   Is Written Off:', car.historyCheckId.isWrittenOff);
      console.log('   Write-off Category:', car.historyCheckId.writeOffCategory);
      console.log('   Has Accident History:', car.historyCheckId.hasAccidentHistory);
      
      console.log('\n🚨 Other Checks:');
      console.log('   Is Stolen:', car.historyCheckId.isStolen);
      console.log('   Outstanding Finance:', car.historyCheckId.hasOutstandingFinance);
      console.log('   Is Scrapped:', car.historyCheckId.isScrapped);
      console.log('   Is Imported:', car.historyCheckId.isImported);
      console.log('   Is Exported:', car.historyCheckId.isExported);
      
      // Test what the frontend would receive
      console.log('\n🌐 Frontend API Response Structure:');
      const apiResponse = {
        success: true,
        data: {
          ...car.toObject(),
          // History data should be populated via populate()
          vehicleHistory: car.historyCheckId
        }
      };
      
      console.log('   Vehicle History in API Response:');
      console.log('   - Previous Owners:', apiResponse.data.vehicleHistory?.previousOwners);
      console.log('   - Keys:', apiResponse.data.vehicleHistory?.keys);
      console.log('   - Write-off Category:', apiResponse.data.vehicleHistory?.writeOffCategory);
      console.log('   - Is Written Off:', apiResponse.data.vehicleHistory?.isWrittenOff);
      console.log('   - Has Accident History:', apiResponse.data.vehicleHistory?.hasAccidentHistory);
      
    } else {
      console.log('❌ No vehicle history linked to this car');
    }

    // Also check if there are any standalone VehicleHistory records for this VRM
    console.log('\n🔍 Checking for standalone VehicleHistory records...');
    const historyRecords = await VehicleHistory.find({ vrm: 'BG22UCP' });
    console.log(`   Found ${historyRecords.length} VehicleHistory record(s) for BG22UCP`);
    
    historyRecords.forEach((record, index) => {
      console.log(`\n   Record ${index + 1}:`);
      console.log('     ID:', record._id);
      console.log('     VRM:', record.vrm);
      console.log('     Previous Owners:', record.previousOwners);
      console.log('     Keys:', record.keys);
      console.log('     Write-off Category:', record.writeOffCategory);
      console.log('     Is Written Off:', record.isWrittenOff);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the check
checkVehicleHistoryAPI();