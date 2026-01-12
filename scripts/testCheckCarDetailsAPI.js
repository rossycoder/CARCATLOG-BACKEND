/**
 * Test script for CheckCarDetails API integration
 * Tests all available data points
 */

require('dotenv').config();
const HistoryService = require('../services/historyService');

// Test VRM - must contain 'A' for test mode
const TEST_VRM = 'AB12CDE';

async function testAllDataPoints() {
  console.log('='.repeat(60));
  console.log('Testing CheckCarDetails API Integration');
  console.log('='.repeat(60));
  console.log(`Test VRM: ${TEST_VRM}`);
  console.log(`API Environment: ${process.env.API_ENVIRONMENT || 'test'}`);
  console.log(`API Key: ${process.env.CHECKCARD_API_KEY?.substring(0, 10)}...`);
  console.log('='.repeat(60));
  console.log('');

  const historyService = new HistoryService();

  // Test 1: Vehicle Registration
  console.log('1. Testing Vehicle Registration (£0.02)');
  console.log('-'.repeat(60));
  try {
    const registration = await historyService.getVehicleRegistration(TEST_VRM);
    console.log('✓ Success!');
    console.log(JSON.stringify(registration, null, 2));
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  // Test 2: Vehicle Specifications
  console.log('2. Testing Vehicle Specifications (£0.04)');
  console.log('-'.repeat(60));
  try {
    const specs = await historyService.getVehicleSpecs(TEST_VRM);
    console.log('✓ Success!');
    console.log(JSON.stringify(specs, null, 2));
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  // Test 3: Mileage History
  console.log('3. Testing Mileage History (£0.02)');
  console.log('-'.repeat(60));
  try {
    const mileage = await historyService.getMileageHistory(TEST_VRM);
    console.log('✓ Success!');
    console.log(JSON.stringify(mileage, null, 2));
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  // Test 4: MOT History
  console.log('4. Testing MOT History (£0.02)');
  console.log('-'.repeat(60));
  try {
    const mot = await historyService.getMOTHistory(TEST_VRM);
    console.log('✓ Success!');
    console.log(JSON.stringify(mot, null, 2));
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  // Test 5: Car History Check
  console.log('5. Testing Car History Check (£1.82)');
  console.log('-'.repeat(60));
  try {
    const history = await historyService.checkVehicleHistory(TEST_VRM, true);
    console.log('✓ Success!');
    console.log(JSON.stringify(history, null, 2));
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  // Test 6: Comprehensive Data (All data points)
  console.log('6. Testing Comprehensive Data (All data points)');
  console.log('-'.repeat(60));
  try {
    const comprehensive = await historyService.getComprehensiveVehicleData(TEST_VRM);
    console.log('✓ Success!');
    console.log(JSON.stringify(comprehensive, null, 2));
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('Testing Complete');
  console.log('='.repeat(60));
}

// Run tests
testAllDataPoints()
  .then(() => {
    console.log('\nAll tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest suite failed:', error);
    process.exit(1);
  });
