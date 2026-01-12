/**
 * Test Backend Integration with CheckCarDetails API
 * Tests the full backend flow: API Client -> Service -> Controller
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const HistoryService = require('../services/historyService');

// Test VRM (must contain 'A' for test API key)
const TEST_VRM = 'AB12CDE';

console.log('\n' + '='.repeat(60));
console.log('Backend Integration Test');
console.log('='.repeat(60));
console.log(`Test VRM: ${TEST_VRM}`);
console.log('='.repeat(60));

async function testVehicleRegistration() {
  console.log('\n📋 Testing Vehicle Registration...');
  try {
    const service = new HistoryService();
    const result = await service.getVehicleRegistration(TEST_VRM);
    console.log('✓ SUCCESS');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log('✗ FAILED:', error.message);
    return false;
  }
}

async function testVehicleSpecs() {
  console.log('\n🔧 Testing Vehicle Specifications...');
  try {
    const service = new HistoryService();
    const result = await service.getVehicleSpecs(TEST_VRM);
    console.log('✓ SUCCESS');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log('✗ FAILED:', error.message);
    return false;
  }
}

async function testMileageHistory() {
  console.log('\n📏 Testing Mileage History...');
  try {
    const service = new HistoryService();
    const result = await service.getMileageHistory(TEST_VRM);
    console.log('✓ SUCCESS');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log('✗ FAILED:', error.message);
    return false;
  }
}

async function testVehicleHistory() {
  console.log('\n🔍 Testing Vehicle History Check...');
  try {
    const service = new HistoryService();
    const result = await service.checkVehicleHistory(TEST_VRM, true); // Force refresh
    console.log('✓ SUCCESS');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log('✗ FAILED:', error.message);
    return false;
  }
}

async function testMOTHistory() {
  console.log('\n🔧 Testing MOT History...');
  try {
    const service = new HistoryService();
    const result = await service.getMOTHistory(TEST_VRM);
    console.log('✓ SUCCESS');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log('✗ FAILED:', error.message);
    return false;
  }
}

async function testComprehensiveData() {
  console.log('\n📊 Testing Comprehensive Vehicle Data...');
  try {
    const service = new HistoryService();
    const result = await service.getComprehensiveVehicleData(TEST_VRM);
    console.log('✓ SUCCESS');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log('✗ FAILED:', error.message);
    return false;
  }
}

async function runTests() {
  const results = [];
  
  results.push(await testVehicleRegistration());
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.push(await testVehicleSpecs());
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.push(await testMileageHistory());
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.push(await testVehicleHistory());
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.push(await testMOTHistory());
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.push(await testComprehensiveData());
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  console.log(`Total: ${results.length}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
