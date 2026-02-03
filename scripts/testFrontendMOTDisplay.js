const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

// Load environment variables
require('dotenv').config();

// Test frontend MOT display by checking car data structure
async function testFrontendMOTDisplay() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    const testVRM = 'RJ08PFA';
    
    console.log(`\n🔍 Testing Frontend MOT Display for: ${testVRM}`);
    console.log('=' .repeat(60));

    // Find car with populated vehicle history
    const car = await Car.findOne({ registrationNumber: testVRM })
      .populate('historyCheckId');

    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('✅ Car found:', car._id);
    
    // Check MOT history in car document
    console.log('\n📊 MOT History in Car Document:');
    console.log('MOT History Count:', car.motHistory ? car.motHistory.length : 0);
    console.log('MOT Status:', car.motStatus);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('MOT Due:', car.motDue);
    
    if (car.motHistory && car.motHistory.length > 0) {
      console.log('\n📋 Latest 3 MOT Tests:');
      car.motHistory.slice(0, 3).forEach((test, index) => {
        console.log(`${index + 1}. ${test.testDate?.toDateString()} - ${test.testResult} (${test.odometerValue} ${test.odometerUnit})`);
        if (test.defects && test.defects.length > 0) {
          console.log(`   Defects: ${test.defects.length} (${test.defects.filter(d => d.dangerous).length} dangerous)`);
        }
      });
    }

    // Check populated vehicle history
    console.log('\n📊 Vehicle History Document:');
    if (car.historyCheckId) {
      console.log('Vehicle History ID:', car.historyCheckId._id);
      console.log('MOT History Count in VH:', car.historyCheckId.motHistory ? car.historyCheckId.motHistory.length : 0);
      console.log('MOT Status in VH:', car.historyCheckId.motStatus);
    } else {
      console.log('No vehicle history document linked');
    }

    // Simulate frontend data structure
    console.log('\n🎯 Frontend Data Structure:');
    const frontendData = {
      _id: car._id,
      registrationNumber: car.registrationNumber,
      motStatus: car.motStatus,
      motExpiry: car.motExpiry,
      motDue: car.motDue,
      motHistory: car.motHistory,
      historyCheckId: car.historyCheckId
    };

    console.log('Frontend MOT Data:', {
      hasMotHistory: !!(frontendData.motHistory && frontendData.motHistory.length > 0),
      motHistoryCount: frontendData.motHistory ? frontendData.motHistory.length : 0,
      hasBasicMOTInfo: !!(frontendData.motStatus || frontendData.motExpiry || frontendData.motDue),
      hasPopulatedHistory: !!(frontendData.historyCheckId && frontendData.historyCheckId.motHistory)
    });

    console.log('\n✅ Frontend MOT Display Test Complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testFrontendMOTDisplay();
}

module.exports = testFrontendMOTDisplay;