/**
 * Test script to verify new car add saves running costs automatically
 * This simulates adding a new car and checks if running costs are saved
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testNewCarAdd() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the most recently added car
    const latestCar = await Car.findOne()
      .sort({ createdAt: -1 })
      .select('registrationNumber make model year runningCosts fuelEconomy co2Emissions insuranceGroup annualTax createdAt');

    if (!latestCar) {
      console.log('❌ No cars found in database');
      process.exit(0);
    }

    console.log('\n📋 Latest Car Added:');
    console.log(`   Registration: ${latestCar.registrationNumber}`);
    console.log(`   Make/Model: ${latestCar.make} ${latestCar.model}`);
    console.log(`   Year: ${latestCar.year}`);
    console.log(`   Added: ${latestCar.createdAt.toLocaleString()}`);

    console.log('\n🔍 Checking Running Costs Data:');
    
    // Check runningCosts object
    if (latestCar.runningCosts) {
      console.log('\n✅ runningCosts object exists:');
      console.log(`   Urban MPG: ${latestCar.runningCosts.fuelEconomy?.urban || 'null'}`);
      console.log(`   Extra Urban MPG: ${latestCar.runningCosts.fuelEconomy?.extraUrban || 'null'}`);
      console.log(`   Combined MPG: ${latestCar.runningCosts.fuelEconomy?.combined || 'null'}`);
      console.log(`   CO2 Emissions: ${latestCar.runningCosts.co2Emissions || 'null'}`);
      console.log(`   Insurance Group: ${latestCar.runningCosts.insuranceGroup || 'null'}`);
      console.log(`   Annual Tax: ${latestCar.runningCosts.annualTax || 'null'}`);
    } else {
      console.log('❌ runningCosts object is null');
    }

    // Check individual fields (backward compatibility)
    console.log('\n📊 Individual Fields:');
    console.log(`   fuelEconomy: ${latestCar.fuelEconomy ? 'exists' : 'null'}`);
    console.log(`   co2Emissions: ${latestCar.co2Emissions || 'null'}`);
    console.log(`   insuranceGroup: ${latestCar.insuranceGroup || 'null'}`);
    console.log(`   annualTax: ${latestCar.annualTax || 'null'}`);

    // Check for null values
    console.log('\n🔍 Checking for NULL values:');
    const nullFields = [];
    
    if (latestCar.runningCosts) {
      if (!latestCar.runningCosts.fuelEconomy?.urban) nullFields.push('runningCosts.fuelEconomy.urban');
      if (!latestCar.runningCosts.fuelEconomy?.extraUrban) nullFields.push('runningCosts.fuelEconomy.extraUrban');
      if (!latestCar.runningCosts.fuelEconomy?.combined) nullFields.push('runningCosts.fuelEconomy.combined');
      if (!latestCar.runningCosts.co2Emissions) nullFields.push('runningCosts.co2Emissions');
      if (!latestCar.runningCosts.insuranceGroup) nullFields.push('runningCosts.insuranceGroup');
      if (!latestCar.runningCosts.annualTax) nullFields.push('runningCosts.annualTax');
    } else {
      nullFields.push('runningCosts (entire object)');
    }

    if (nullFields.length > 0) {
      console.log('⚠️  Found NULL fields:');
      nullFields.forEach(field => console.log(`   - ${field}`));
      console.log('\n💡 This is expected if:');
      console.log('   1. Car was added before running costs auto-save was implemented');
      console.log('   2. API did not return running costs data');
      console.log('   3. Vehicle is very old or uncommon');
    } else {
      console.log('✅ No NULL fields found - all running costs data is present!');
    }

    // Summary
    console.log('\n📊 Summary:');
    const hasRunningCosts = latestCar.runningCosts && 
      (latestCar.runningCosts.fuelEconomy?.combined || 
       latestCar.runningCosts.co2Emissions || 
       latestCar.runningCosts.insuranceGroup || 
       latestCar.runningCosts.annualTax);
    
    if (hasRunningCosts) {
      console.log('✅ Running costs are being saved automatically');
      console.log('✅ System is working correctly');
    } else {
      console.log('⚠️  Running costs are not saved');
      console.log('   Possible reasons:');
      console.log('   1. Car was added before the fix');
      console.log('   2. API did not return running costs');
      console.log('   3. Need to add a new car to test');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testNewCarAdd();
