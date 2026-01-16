/**
 * Test script for Enhanced Vehicle Service
 * Tests parallel API calls and data merging
 */

require('dotenv').config();
const mongoose = require('mongoose');
const enhancedVehicleService = require('../services/enhancedVehicleService');

// Test registration numbers
const TEST_REGISTRATIONS = ['AB12CDE', 'BD51SMR', 'KT17DLX'];

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function testEnhancedLookup(registration) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Enhanced Lookup: ${registration}`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();
    const result = await enhancedVehicleService.getEnhancedVehicleData(registration, false);
    const endTime = Date.now();

    console.log(`\n✅ Lookup completed in ${endTime - startTime}ms`);
    console.log('\nData Sources:');
    console.log(`  DVLA: ${result.dataSources.dvla ? '✅' : '❌'}`);
    console.log(`  CheckCarDetails: ${result.dataSources.checkCarDetails ? '✅' : '❌'}`);

    console.log('\nBasic Vehicle Info:');
    console.log(`  Make: ${result.make.value} (${result.make.source})`);
    console.log(`  Model: ${result.model.value} (${result.model.source})`);
    console.log(`  Year: ${result.year.value} (${result.year.source})`);
    console.log(`  Fuel Type: ${result.fuelType.value} (${result.fuelType.source})`);

    console.log('\nRunning Costs:');
    console.log(`  Urban MPG: ${result.runningCosts.fuelEconomy.urban.value} (${result.runningCosts.fuelEconomy.urban.source})`);
    console.log(`  Combined MPG: ${result.runningCosts.fuelEconomy.combined.value} (${result.runningCosts.fuelEconomy.combined.source})`);
    console.log(`  CO2: ${result.runningCosts.co2Emissions.value} g/km (${result.runningCosts.co2Emissions.source})`);
    console.log(`  Insurance: ${result.runningCosts.insuranceGroup.value} (${result.runningCosts.insuranceGroup.source})`);

    console.log('\nPerformance:');
    console.log(`  Power: ${result.performance.power.value} bhp (${result.performance.power.source})`);
    console.log(`  Torque: ${result.performance.torque.value} Nm (${result.performance.torque.source})`);

    return true;
  } catch (error) {
    console.error(`\n❌ Lookup failed:`, error.message);
    return false;
  }
}

async function testCaching(registration) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Cache Functionality: ${registration}`);
  console.log('='.repeat(60));

  try {
    // First call - should hit APIs
    console.log('\n1. First call (no cache):');
    const start1 = Date.now();
    await enhancedVehicleService.getEnhancedVehicleData(registration, false);
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms`);

    // Second call - should hit cache
    console.log('\n2. Second call (with cache):');
    const start2 = Date.now();
    await enhancedVehicleService.getEnhancedVehicleData(registration, true);
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms`);

    if (time2 < time1 / 2) {
      console.log(`\n✅ Cache working! Second call was ${Math.round((1 - time2/time1) * 100)}% faster`);
    } else {
      console.log(`\n⚠️  Cache may not be working as expected`);
    }

    return true;
  } catch (error) {
    console.error(`\n❌ Cache test failed:`, error.message);
    return false;
  }
}

async function testFallback() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Fallback Handling`);
  console.log('='.repeat(60));

  try {
    const result = await enhancedVehicleService.getVehicleDataWithFallback('AB12CDE');
    
    console.log(`\nSuccess: ${result.success}`);
    if (result.warnings && result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }

    return true;
  } catch (error) {
    console.error(`\n❌ Fallback test failed:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhanced Vehicle Service Tests\n');

  await connectDatabase();

  const results = [];

  // Test enhanced lookup for each registration
  for (const reg of TEST_REGISTRATIONS) {
    results.push(await testEnhancedLookup(reg));
  }

  // Test caching
  results.push(await testCaching(TEST_REGISTRATIONS[0]));

  // Test fallback handling
  results.push(await testFallback());

  // Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n❌ Some tests failed');
  }

  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
