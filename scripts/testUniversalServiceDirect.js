const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

async function testUniversalServiceDirect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    console.log('=== TESTING UNIVERSAL SERVICE DIRECTLY ===');
    
    // Find an existing car to test with
    const existingCar = await Car.findOne({ registrationNumber: { $exists: true } });
    
    if (!existingCar) {
      console.log('❌ No existing car found with registration number');
      return;
    }

    console.log(`🚗 Testing with existing car: ${existingCar.registrationNumber}`);
    console.log(`   Make/Model: ${existingCar.make} ${existingCar.model}`);

    const universalService = new UniversalAutoCompleteService();
    
    console.log('\n🔍 Checking if car needs completion...');
    const needsCompletion = universalService.needsCompletion(existingCar);
    console.log(`   Needs completion: ${needsCompletion}`);

    if (needsCompletion) {
      console.log('\n🚀 Running universal auto-complete service...');
      
      const startTime = Date.now();
      const result = await universalService.completeCarData(existingCar, false);
      const endTime = Date.now();
      
      console.log(`✅ Service completed in ${endTime - startTime}ms`);
      
      // Fetch updated car from database
      const updatedCar = await Car.findById(existingCar._id);
      
      console.log('\n📊 COMPARISON:');
      console.log('Field                | Before    | After');
      console.log('---------------------|-----------|----------');
      console.log(`Variant              | ${(existingCar.variant || 'Missing').padEnd(9)} | ${updatedCar.variant || 'Missing'}`);
      console.log(`Engine Size          | ${(existingCar.engineSize || 'Missing').toString().padEnd(9)} | ${updatedCar.engineSize || 'Missing'}`);
      console.log(`Doors                | ${(existingCar.doors || 'Missing').toString().padEnd(9)} | ${updatedCar.doors || 'Missing'}`);
      console.log(`Seats                | ${(existingCar.seats || 'Missing').toString().padEnd(9)} | ${updatedCar.seats || 'Missing'}`);
      console.log(`Urban MPG            | ${(existingCar.urbanMpg || 'Missing').toString().padEnd(9)} | ${updatedCar.urbanMpg || 'Missing'}`);
      console.log(`Combined MPG         | ${(existingCar.combinedMpg || 'Missing').toString().padEnd(9)} | ${updatedCar.combinedMpg || 'Missing'}`);
      console.log(`Annual Tax           | ${(existingCar.annualTax || 'Missing').toString().padEnd(9)} | ${updatedCar.annualTax || 'Missing'}`);
      console.log(`CO2 Emissions        | ${(existingCar.co2Emissions || 'Missing').toString().padEnd(9)} | ${updatedCar.co2Emissions || 'Missing'}`);
      console.log(`MOT Status           | ${(existingCar.motStatus || 'Missing').padEnd(9)} | ${updatedCar.motStatus || 'Missing'}`);
      
      // Check completeness after
      const stillNeedsCompletion = universalService.needsCompletion(updatedCar);
      console.log(`\n🔍 Still needs completion: ${stillNeedsCompletion}`);
      
      if (!stillNeedsCompletion) {
        console.log('🎉 SUCCESS! Car now has complete data!');
      } else {
        console.log('⚠️  Car still missing some data');
      }
      
    } else {
      console.log('✅ Car already has complete data');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

testUniversalServiceDirect();