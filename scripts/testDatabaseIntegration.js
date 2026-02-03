const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function testDatabaseIntegration() {
  try {
    console.log('🔍 Testing Database Integration for Vehicle History & MOT Data');
    console.log('=' .repeat(60));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if cars have historyCheckId populated
    console.log('\n📋 Test 1: Checking Car documents with vehicle history...');
    const carsWithHistory = await Car.find({ 
      historyCheckId: { $exists: true, $ne: null } 
    }).limit(5);
    
    console.log(`Found ${carsWithHistory.length} cars with vehicle history references`);
    
    if (carsWithHistory.length > 0) {
      const sampleCar = carsWithHistory[0];
      console.log(`Sample car: ${sampleCar.make} ${sampleCar.model} (${sampleCar.registrationNumber})`);
      console.log(`History ID: ${sampleCar.historyCheckId}`);
      console.log(`MOT Status: ${sampleCar.motStatus || 'Not set'}`);
      console.log(`MOT Due: ${sampleCar.motDue || 'Not set'}`);
    }

    // Test 2: Check VehicleHistory collection
    console.log('\n📋 Test 2: Checking VehicleHistory collection...');
    const historyCount = await VehicleHistory.countDocuments();
    console.log(`Total VehicleHistory documents: ${historyCount}`);
    
    if (historyCount > 0) {
      const sampleHistory = await VehicleHistory.findOne().sort({ checkDate: -1 });
      console.log(`Latest history check: ${sampleHistory.vrm}`);
      console.log(`Check date: ${sampleHistory.checkDate}`);
      console.log(`Previous keepers: ${sampleHistory.numberOfPreviousKeepers || 0}`);
      console.log(`Write-off status: ${sampleHistory.isWrittenOff ? 'Yes' : 'No'}`);
      console.log(`MOT Status in history: ${sampleHistory.motStatus || 'Not set'}`);
    }

    // Test 3: Test populated query (like frontend uses)
    console.log('\n📋 Test 3: Testing populated query (frontend simulation)...');
    const carWithPopulatedHistory = await Car.findOne({ 
      historyCheckId: { $exists: true, $ne: null } 
    }).populate('historyCheckId');
    
    if (carWithPopulatedHistory) {
      console.log(`✅ Car found: ${carWithPopulatedHistory.registrationNumber}`);
      console.log(`✅ History populated: ${carWithPopulatedHistory.historyCheckId ? 'Yes' : 'No'}`);
      
      if (carWithPopulatedHistory.historyCheckId) {
        const history = carWithPopulatedHistory.historyCheckId;
        console.log(`   - VRM: ${history.vrm}`);
        console.log(`   - Previous keepers: ${history.numberOfPreviousKeepers || 0}`);
        console.log(`   - Accident history: ${history.hasAccidentHistory ? 'Yes' : 'No'}`);
        console.log(`   - Write-off: ${history.isWrittenOff ? 'Yes' : 'No'}`);
        console.log(`   - MOT Status: ${history.motStatus || 'Not available'}`);
        console.log(`   - MOT Expiry: ${history.motExpiryDate || 'Not available'}`);
      }
    } else {
      console.log('❌ No cars found with populated history');
    }

    // Test 4: Check valuation data
    console.log('\n📋 Test 4: Checking valuation data in cars...');
    const carsWithValuation = await Car.find({ 
      'valuation.privatePrice': { $exists: true, $ne: null } 
    }).limit(3);
    
    console.log(`Found ${carsWithValuation.length} cars with valuation data`);
    
    carsWithValuation.forEach((car, index) => {
      console.log(`Car ${index + 1}: ${car.registrationNumber}`);
      console.log(`   - Private Price: £${car.valuation.privatePrice || 'Not set'}`);
      console.log(`   - Dealer Price: £${car.valuation.dealerPrice || 'Not set'}`);
      console.log(`   - Trade Price: £${car.valuation.partExchangePrice || 'Not set'}`);
      console.log(`   - Valuation Date: ${car.valuation.valuationDate || 'Not set'}`);
    });

    // Test 5: Check MOT data distribution
    console.log('\n📋 Test 5: Checking MOT data distribution...');
    const totalCars = await Car.countDocuments();
    const carsWithMOTStatus = await Car.countDocuments({ motStatus: { $exists: true, $ne: null } });
    const carsWithMOTDue = await Car.countDocuments({ motDue: { $exists: true, $ne: null } });
    
    console.log(`Total cars: ${totalCars}`);
    console.log(`Cars with MOT status: ${carsWithMOTStatus} (${((carsWithMOTStatus/totalCars)*100).toFixed(1)}%)`);
    console.log(`Cars with MOT due date: ${carsWithMOTDue} (${((carsWithMOTDue/totalCars)*100).toFixed(1)}%)`);

    // Test 6: Simulate frontend data structure
    console.log('\n📋 Test 6: Simulating frontend data structure...');
    const frontendSimulation = await Car.findOne({ 
      historyCheckId: { $exists: true, $ne: null } 
    }).populate('historyCheckId');
    
    if (frontendSimulation) {
      // This is what frontend components will receive
      const carData = {
        _id: frontendSimulation._id,
        registrationNumber: frontendSimulation.registrationNumber,
        make: frontendSimulation.make,
        model: frontendSimulation.model,
        motStatus: frontendSimulation.motStatus,
        motDue: frontendSimulation.motDue,
        motExpiry: frontendSimulation.motExpiry,
        historyCheckId: frontendSimulation.historyCheckId,
        valuation: frontendSimulation.valuation
      };
      
      console.log('Frontend will receive this structure:');
      console.log('carData.motStatus:', carData.motStatus || 'undefined');
      console.log('carData.motDue:', carData.motDue || 'undefined');
      console.log('carData.historyCheckId.vrm:', carData.historyCheckId?.vrm || 'undefined');
      console.log('carData.historyCheckId.motStatus:', carData.historyCheckId?.motStatus || 'undefined');
      console.log('carData.valuation.privatePrice:', carData.valuation?.privatePrice || 'undefined');
    }

    console.log('\n🎉 Database Integration Test Complete!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the test
testDatabaseIntegration();