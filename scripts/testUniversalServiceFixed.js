/**
 * Test Universal Auto Complete Service (Fixed Version)
 * Tests the fixed universal service to ensure it works properly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
const Car = require('../models/Car');

async function testUniversalService() {
  try {
    console.log('🧪 Testing Universal Auto Complete Service (Fixed Version)...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Create test car
    const testCar = new Car({
      make: 'BMW',
      model: 'i4',
      year: 2022,
      registrationNumber: 'BG22UCP',
      mileage: 15000,
      price: 35000,
      fuelType: 'Electric',
      color: 'Blue',
      postcode: 'M1 1AA',
      description: 'Test electric vehicle',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'test@example.com'
      },
      advertStatus: 'active'
    });
    
    console.log('🚗 Created test car:', {
      make: testCar.make,
      model: testCar.model,
      registration: testCar.registrationNumber,
      fuelType: testCar.fuelType
    });
    
    // Test universal service
    const universalService = new UniversalAutoCompleteService();
    
    console.log('\n🔍 Testing needsCompletion check...');
    const needsCompletion = universalService.needsCompletion(testCar);
    console.log(`   Needs completion: ${needsCompletion}`);
    
    if (needsCompletion) {
      console.log('\n🚀 Running universal auto-complete...');
      const completedCar = await universalService.completeCarData(testCar, false);
      
      console.log('\n✅ Universal service completed successfully!');
      console.log('📊 Results:');
      console.log(`   Variant: ${completedCar.variant || 'N/A'}`);
      console.log(`   Transmission: ${completedCar.transmission || 'N/A'}`);
      console.log(`   Engine Size: ${completedCar.engineSize || 'N/A'}L`);
      console.log(`   Doors: ${completedCar.doors || 'N/A'}`);
      console.log(`   Seats: ${completedCar.seats || 'N/A'}`);
      console.log(`   Annual Tax: £${completedCar.annualTax || 'N/A'}`);
      console.log(`   CO2 Emissions: ${completedCar.co2Emissions || 'N/A'}g/km`);
      console.log(`   Electric Range: ${completedCar.electricRange || 'N/A'} miles`);
      console.log(`   Battery Capacity: ${completedCar.batteryCapacity || 'N/A'} kWh`);
      console.log(`   MOT Status: ${completedCar.motStatus || 'N/A'}`);
      console.log(`   MOT Due: ${completedCar.motDue ? new Date(completedCar.motDue).toLocaleDateString('en-GB') : 'N/A'}`);
      
      // Check running costs object
      if (completedCar.runningCosts) {
        console.log('\n💰 Running Costs:');
        console.log(`   Urban MPG: ${completedCar.runningCosts.fuelEconomy?.urban || 'N/A'}`);
        console.log(`   Combined MPG: ${completedCar.runningCosts.fuelEconomy?.combined || 'N/A'}`);
        console.log(`   Annual Tax: £${completedCar.runningCosts.annualTax || 'N/A'}`);
        console.log(`   Insurance Group: ${completedCar.runningCosts.insuranceGroup || 'N/A'}`);
        console.log(`   Electric Range: ${completedCar.runningCosts.electricRange || 'N/A'} miles`);
        console.log(`   Battery Capacity: ${completedCar.runningCosts.batteryCapacity || 'N/A'} kWh`);
      }
      
      // Check history link
      if (completedCar.historyCheckId) {
        console.log(`\n📚 Vehicle History: Linked to ${completedCar.historyCheckId}`);
        console.log(`   Status: ${completedCar.historyCheckStatus}`);
        console.log(`   Date: ${completedCar.historyCheckDate ? new Date(completedCar.historyCheckDate).toLocaleDateString('en-GB') : 'N/A'}`);
      }
      
    } else {
      console.log('✅ Car already has complete data - no completion needed');
    }
    
    console.log('\n🎉 Universal service test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from database');
  }
}

// Run test
testUniversalService();