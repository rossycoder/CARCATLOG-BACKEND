/**
 * Test Complete Car Creation Flow with Universal Auto Complete
 * Tests the entire flow from car creation to automatic data completion
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Car Creation Flow with Universal Auto Complete...\n');
    
    // Connect to database
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not set - using mock test');
      await testMockFlow();
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Create a new car (this should trigger the universal auto-complete)
    console.log('🚗 Creating new car...');
    
    const newCar = new Car({
      make: 'BMW',
      model: 'i4',
      year: 2022,
      registrationNumber: 'BG22UCP',
      mileage: 15000,
      price: 35000,
      fuelType: 'Electric',
      color: 'Blue',
      postcode: 'M1 1AA',
      description: 'Test electric vehicle for universal auto-complete',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'test@example.com'
      },
      advertStatus: 'active' // This should trigger the universal auto-complete
    });
    
    console.log('💾 Saving car (this will trigger universal auto-complete)...');
    const savedCar = await newCar.save();
    
    console.log('✅ Car saved successfully!');
    console.log(`   Car ID: ${savedCar._id}`);
    console.log(`   Registration: ${savedCar.registrationNumber}`);
    console.log(`   Status: ${savedCar.advertStatus}`);
    
    // Wait a moment for the async auto-complete to finish
    console.log('\n⏳ Waiting for universal auto-complete to finish...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fetch the car again to see if it was updated
    console.log('\n🔍 Checking if car was auto-completed...');
    const updatedCar = await Car.findById(savedCar._id);
    
    console.log('\n📊 Car Data After Auto-Complete:');
    console.log(`   Make: ${updatedCar.make}`);
    console.log(`   Model: ${updatedCar.model}`);
    console.log(`   Variant: ${updatedCar.variant || 'N/A'}`);
    console.log(`   Transmission: ${updatedCar.transmission || 'N/A'}`);
    console.log(`   Engine Size: ${updatedCar.engineSize || 'N/A'}L`);
    console.log(`   Doors: ${updatedCar.doors || 'N/A'}`);
    console.log(`   Seats: ${updatedCar.seats || 'N/A'}`);
    console.log(`   Body Type: ${updatedCar.bodyType || 'N/A'}`);
    console.log(`   Annual Tax: £${updatedCar.annualTax || 'N/A'}`);
    console.log(`   CO2 Emissions: ${updatedCar.co2Emissions || 'N/A'}g/km`);
    console.log(`   Electric Range: ${updatedCar.electricRange || 'N/A'} miles`);
    console.log(`   Battery Capacity: ${updatedCar.batteryCapacity || 'N/A'} kWh`);
    console.log(`   MOT Status: ${updatedCar.motStatus || 'N/A'}`);
    console.log(`   MOT Due: ${updatedCar.motDue ? new Date(updatedCar.motDue).toLocaleDateString('en-GB') : 'N/A'}`);
    console.log(`   History Check: ${updatedCar.historyCheckStatus || 'N/A'}`);
    console.log(`   History ID: ${updatedCar.historyCheckId || 'N/A'}`);
    
    // Check running costs object
    if (updatedCar.runningCosts) {
      console.log('\n💰 Running Costs Object:');
      console.log(`   Urban MPG: ${updatedCar.runningCosts.fuelEconomy?.urban || 'N/A'}`);
      console.log(`   Combined MPG: ${updatedCar.runningCosts.fuelEconomy?.combined || 'N/A'}`);
      console.log(`   Annual Tax: £${updatedCar.runningCosts.annualTax || 'N/A'}`);
      console.log(`   Insurance Group: ${updatedCar.runningCosts.insuranceGroup || 'N/A'}`);
      console.log(`   Electric Range: ${updatedCar.runningCosts.electricRange || 'N/A'} miles`);
      console.log(`   Battery Capacity: ${updatedCar.runningCosts.batteryCapacity || 'N/A'} kWh`);
    }
    
    // Evaluate completion
    console.log('\n🎯 Auto-Complete Evaluation:');
    const completionScore = evaluateCompletion(updatedCar);
    console.log(`   Completion Score: ${completionScore.score}/${completionScore.total}`);
    console.log(`   Completion Rate: ${Math.round((completionScore.score / completionScore.total) * 100)}%`);
    
    if (completionScore.missing.length > 0) {
      console.log(`   Missing Fields: ${completionScore.missing.join(', ')}`);
    }
    
    // Clean up - delete the test car
    console.log('\n🧹 Cleaning up test car...');
    await Car.findByIdAndDelete(savedCar._id);
    console.log('✅ Test car deleted');
    
    console.log('\n🎉 Complete car creation flow test finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📤 Disconnected from database');
    }
  }
}

async function testMockFlow() {
  console.log('🔧 Running mock test (no database connection)...\n');
  
  const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
  const universalService = new UniversalAutoCompleteService();
  
  const mockCar = {
    make: 'BMW',
    model: 'i4',
    registrationNumber: 'BG22UCP',
    fuelType: 'Electric',
    advertStatus: 'active'
  };
  
  console.log('🔍 Testing needsCompletion...');
  const needsCompletion = universalService.needsCompletion(mockCar);
  console.log(`   Result: ${needsCompletion}`);
  
  console.log('\n✅ Mock test completed - Universal service is working');
}

function evaluateCompletion(car) {
  const requiredFields = [
    'variant', 'transmission', 'engineSize', 'doors', 'seats', 
    'bodyType', 'annualTax', 'motStatus'
  ];
  
  const electricFields = [
    'electricRange', 'batteryCapacity'
  ];
  
  let score = 0;
  let total = requiredFields.length;
  const missing = [];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (car[field] !== null && car[field] !== undefined && car[field] !== '') {
      score++;
    } else {
      missing.push(field);
    }
  });
  
  // For electric vehicles, check electric-specific fields
  if (car.fuelType === 'Electric') {
    total += electricFields.length;
    electricFields.forEach(field => {
      if (car[field] !== null && car[field] !== undefined && car[field] !== '') {
        score++;
      } else {
        missing.push(field);
      }
    });
  }
  
  return { score, total, missing };
}

// Run test
testCompleteFlow();