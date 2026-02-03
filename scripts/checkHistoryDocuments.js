const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkHistoryDocuments() {
  try {
    console.log('🔍 Checking History Documents...');
    console.log('=' .repeat(40));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // List all VehicleHistory documents
    console.log('\n📋 All VehicleHistory documents:');
    const allHistory = await VehicleHistory.find({}).sort({ checkDate: -1 });
    
    allHistory.forEach((history, index) => {
      console.log(`${index + 1}. VRM: ${history.vrm}, ID: ${history._id}, Date: ${history.checkDate}`);
    });

    // List all Cars with historyCheckId
    console.log('\n📋 All Cars with historyCheckId:');
    const carsWithHistory = await Car.find({ 
      historyCheckId: { $exists: true, $ne: null } 
    });
    
    carsWithHistory.forEach((car, index) => {
      console.log(`${index + 1}. VRM: ${car.registrationNumber}, historyCheckId: ${car.historyCheckId}`);
    });

    // Check for mismatches
    console.log('\n🔍 Checking for mismatches...');
    for (const car of carsWithHistory) {
      const historyExists = await VehicleHistory.findById(car.historyCheckId);
      if (!historyExists) {
        console.log(`❌ Car ${car.registrationNumber} references non-existent history: ${car.historyCheckId}`);
        
        // Try to find history by VRM
        const historyByVrm = await VehicleHistory.findOne({ vrm: car.registrationNumber.toUpperCase() });
        if (historyByVrm) {
          console.log(`   ✅ Found history by VRM: ${historyByVrm._id}`);
          
          // Fix the reference
          await Car.findByIdAndUpdate(car._id, {
            historyCheckId: historyByVrm._id
          });
          console.log(`   ✅ Fixed reference for ${car.registrationNumber}`);
        } else {
          console.log(`   ❌ No history found for VRM: ${car.registrationNumber}`);
        }
      } else {
        console.log(`✅ Car ${car.registrationNumber} has valid history reference`);
      }
    }

    // Test populate after fixes
    console.log('\n🔄 Testing populate after fixes...');
    const testCar = await Car.findOne({ 
      historyCheckId: { $exists: true, $ne: null } 
    }).populate('historyCheckId');

    if (testCar && testCar.historyCheckId) {
      console.log(`✅ Populate working! Car: ${testCar.registrationNumber}`);
      console.log(`   History VRM: ${testCar.historyCheckId.vrm}`);
      console.log(`   Previous keepers: ${testCar.historyCheckId.numberOfPreviousKeepers || 0}`);
      console.log(`   Write-off: ${testCar.historyCheckId.isWrittenOff ? 'Yes' : 'No'}`);
      console.log(`   MOT Status: ${testCar.historyCheckId.motStatus || 'Not set'}`);
    } else {
      console.log(`❌ Populate still not working`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the check
checkHistoryDocuments();