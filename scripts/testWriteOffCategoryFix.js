/**
 * Test and Fix Write-off Category Issue
 * EK11XHZ should show CAT N, not 'none'
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function testWriteOffCategoryFix() {
  try {
    console.log('🔧 Testing Write-off Category Fix\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const testVRM = 'EK11XHZ';
    console.log(`🚗 Testing write-off category for: ${testVRM}\n`);
    
    // Step 1: Clear cache and make fresh API call
    console.log('1️⃣ Clearing cache and making fresh API call...');
    await VehicleHistory.deleteMany({ vrm: testVRM });
    
    const vehicleData = await enhancedVehicleService.getEnhancedVehicleData(testVRM, true, 2500);
    
    console.log('✅ API call completed');
    console.log(`   Write-off Category in API response: ${vehicleData.writeOffCategory}`);
    console.log(`   Write-off Details:`, vehicleData.writeOffDetails);
    console.log(`   Is Written Off: ${vehicleData.isWrittenOff}`);
    console.log(`   History Check ID: ${vehicleData.historyCheckId}\n`);
    
    // Step 2: Check what's saved in VehicleHistory
    console.log('2️⃣ Checking VehicleHistory document...');
    const historyDoc = await VehicleHistory.findOne({ vrm: testVRM });
    
    if (historyDoc) {
      console.log('✅ VehicleHistory document found');
      console.log(`   Write-off Category: ${historyDoc.writeOffCategory}`);
      console.log(`   Write-off Details:`, historyDoc.writeOffDetails);
      console.log(`   Is Written Off: ${historyDoc.isWrittenOff}`);
    } else {
      console.log('❌ No VehicleHistory document found');
    }
    
    // Step 3: Check car document
    console.log('\n3️⃣ Checking Car document...');
    const car = await Car.findOne({ registrationNumber: testVRM }).populate('historyCheckId');
    
    if (car && car.historyCheckId) {
      console.log('✅ Car found with populated history');
      console.log(`   History Write-off Category: ${car.historyCheckId.writeOffCategory}`);
      console.log(`   History Write-off Details:`, car.historyCheckId.writeOffDetails);
      console.log(`   History Is Written Off: ${car.historyCheckId.isWrittenOff}`);
    } else if (car) {
      console.log('⚠️  Car found but no history populated');
      console.log(`   History Check ID: ${car.historyCheckId}`);
    } else {
      console.log('❌ No car found');
    }
    
    // Step 4: Test frontend data structure
    console.log('\n4️⃣ Testing frontend data structure...');
    if (car && car.historyCheckId) {
      const frontendData = {
        writeOffCategory: car.historyCheckId.writeOffCategory,
        writeOffDetails: car.historyCheckId.writeOffDetails,
        isWrittenOff: car.historyCheckId.isWrittenOff,
        hasAccidentHistory: car.historyCheckId.hasAccidentHistory
      };
      
      console.log('Frontend will receive:', frontendData);
      
      // Check if write-off should be displayed
      const shouldShowWriteOff = frontendData.writeOffCategory && 
                                 frontendData.writeOffCategory !== 'none' && 
                                 frontendData.writeOffCategory !== 'unknown';
      
      console.log(`Should show write-off warning: ${shouldShowWriteOff}`);
      
      if (shouldShowWriteOff) {
        console.log('✅ Write-off category will be displayed correctly');
      } else {
        console.log('❌ Write-off category will NOT be displayed - this is the bug!');
      }
    }
    
    // Step 5: Expected vs Actual
    console.log('\n5️⃣ Expected vs Actual:');
    console.log('Expected: EK11XHZ should show CAT N (Non-structural damage)');
    console.log(`Actual: ${historyDoc?.writeOffCategory || 'none'}`);
    
    if (historyDoc?.writeOffCategory === 'N') {
      console.log('✅ SUCCESS - Write-off category is correct!');
    } else {
      console.log('❌ FAILED - Write-off category is incorrect');
      
      // Try to fix it
      if (historyDoc && vehicleData.writeOffDetails?.category) {
        console.log('\n🔧 Attempting to fix...');
        historyDoc.writeOffCategory = vehicleData.writeOffDetails.category;
        historyDoc.isWrittenOff = true;
        await historyDoc.save();
        console.log(`✅ Fixed write-off category to: ${historyDoc.writeOffCategory}`);
      }
    }
    
    console.log('\n🎉 Write-off Category Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testWriteOffCategoryFix();