/**
 * Fetch EK11XHZ MOT History from API and save to database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const MOTHistoryService = require('../services/motHistoryService');

async function fetchEK11XHZMOTHistory() {
  try {
    console.log('🔍 Fetching EK11XHZ MOT History from API\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const vrm = 'EK11XHZ';
    
    // Step 1: Fetch MOT history from API
    console.log('1️⃣ Fetching MOT history from CheckCarDetails API...');
    const motHistoryService = new MOTHistoryService();
    
    const motResult = await motHistoryService.fetchAndSaveMOTHistory(vrm, true); // Force refresh
    
    console.log(`✅ MOT API call completed`);
    console.log(`   Success: ${motResult.success}`);
    console.log(`   Count: ${motResult.count}`);
    console.log(`   Source: ${motResult.source}`);
    
    if (motResult.success && motResult.data && motResult.data.length > 0) {
      console.log(`   First test: ${motResult.data[0].testDate} - ${motResult.data[0].testResult}`);
      console.log(`   Latest test: ${motResult.data[motResult.data.length - 1].testDate} - ${motResult.data[motResult.data.length - 1].testResult}`);
    }
    
    // Step 2: Update VehicleHistory document
    console.log('\n2️⃣ Updating VehicleHistory document...');
    const historyDoc = await VehicleHistory.findOne({ vrm: vrm }).sort({ checkDate: -1 });
    
    if (historyDoc && motResult.data && motResult.data.length > 0) {
      historyDoc.motHistory = motResult.data;
      await historyDoc.save();
      console.log(`✅ Updated VehicleHistory with ${motResult.data.length} MOT tests`);
    }
    
    // Step 3: Update Car document
    console.log('\n3️⃣ Updating Car document...');
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (car && motResult.data && motResult.data.length > 0) {
      car.motHistory = motResult.data;
      
      // Update MOT status from latest test
      const latestTest = motResult.data[0]; // Most recent test
      if (latestTest) {
        car.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
        car.motExpiry = latestTest.expiryDate;
        car.motDue = latestTest.expiryDate;
        console.log(`   Updated MOT status: ${car.motStatus}, expires: ${car.motExpiry}`);
      }
      
      await car.save();
      console.log(`✅ Updated Car with ${motResult.data.length} MOT tests`);
    }
    
    // Step 4: Verify the fix
    console.log('\n4️⃣ Verifying the fix...');
    const updatedCar = await Car.findOne({ registrationNumber: vrm }).populate('historyCheckId');
    
    console.log('Final verification:');
    console.log(`   Car MOT History: ${updatedCar.motHistory?.length || 0} tests`);
    console.log(`   VehicleHistory MOT History: ${updatedCar.historyCheckId?.motHistory?.length || 0} tests`);
    console.log(`   MOT Status: ${updatedCar.motStatus}`);
    console.log(`   MOT Expiry: ${updatedCar.motExpiry}`);
    console.log(`   Write-off Category: ${updatedCar.historyCheckId?.writeOffCategory}`);
    
    if (updatedCar.motHistory && updatedCar.motHistory.length > 0) {
      console.log('\n✅ SUCCESS - MOT History is now available!');
      console.log('💡 Frontend should now show complete MOT history');
    } else {
      console.log('\n❌ FAILED - MOT History still not available');
    }
    
  } catch (error) {
    console.error('❌ Fetch failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fetch
fetchEK11XHZMOTHistory();