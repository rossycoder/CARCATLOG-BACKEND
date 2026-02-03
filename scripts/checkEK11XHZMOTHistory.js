/**
 * Check EK11XHZ MOT History - Why are there 0 tests?
 */

const mongoose = require('mongoose');
require('dotenv').config();

const VehicleHistory = require('../models/VehicleHistory');

async function checkEK11XHZMOTHistory() {
  try {
    console.log('🔍 Checking EK11XHZ MOT History\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const vrm = 'EK11XHZ';
    
    // Find all VehicleHistory documents for this VRM
    const historyDocs = await VehicleHistory.find({ vrm: vrm }).sort({ checkDate: -1 });
    
    console.log(`Found ${historyDocs.length} VehicleHistory documents for ${vrm}:\n`);
    
    historyDocs.forEach((doc, index) => {
      console.log(`${index + 1}. Document ID: ${doc._id}`);
      console.log(`   Created: ${doc.checkDate}`);
      console.log(`   Write-off Category: ${doc.writeOffCategory}`);
      console.log(`   Is Written Off: ${doc.isWrittenOff}`);
      console.log(`   MOT History: ${doc.motHistory?.length || 0} tests`);
      
      if (doc.motHistory && doc.motHistory.length > 0) {
        console.log(`   MOT Tests:`);
        doc.motHistory.slice(0, 3).forEach((test, i) => {
          console.log(`     ${i + 1}. ${test.testDate} - ${test.testResult} (${test.odometerValue} miles)`);
        });
        if (doc.motHistory.length > 3) {
          console.log(`     ... and ${doc.motHistory.length - 3} more tests`);
        }
      }
      console.log('');
    });
    
    // Check if there's a document with MOT history
    const docWithMOT = historyDocs.find(doc => doc.motHistory && doc.motHistory.length > 0);
    
    if (docWithMOT) {
      console.log(`✅ Found document with MOT history: ${docWithMOT._id}`);
      console.log(`   MOT Tests: ${docWithMOT.motHistory.length}`);
      
      // Update the car to use this document
      const Car = require('../models/Car');
      const car = await Car.findOne({ registrationNumber: vrm });
      
      if (car) {
        car.historyCheckId = docWithMOT._id;
        car.motHistory = docWithMOT.motHistory;
        await car.save();
        console.log(`✅ Updated car to use document with MOT history`);
      }
    } else {
      console.log(`❌ No document found with MOT history`);
      console.log(`💡 Need to fetch MOT history from API`);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the check
checkEK11XHZMOTHistory();