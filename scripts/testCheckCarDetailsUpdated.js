/**
 * Test script for updated CheckCarDetails API client
 * Tests the new endpoint structure with different data points
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testCheckCarDetailsAPI() {
  console.log('=== Testing Updated CheckCarDetails API Client ===\n');

  // Test VRM - must contain 'A' for test mode
  const testVRM = 'AB12CDE'; // Example VRM with 'A'

  try {
    console.log(`Testing with VRM: ${testVRM}`);
    console.log(`API Environment: ${process.env.API_ENVIRONMENT || 'test'}`);
    console.log(`Base URL: ${process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk'}\n`);

    // Test 1: Get UK Vehicle Data (includes running costs)
    console.log('--- Test 1: UK Vehicle Data (ukvehicledata) ---');
    try {
      const vehicleData = await CheckCarDetailsClient.getVehicleData(testVRM);
      console.log('✓ Vehicle data fetched successfully');
      console.log('Data:', JSON.stringify(vehicleData, null, 2));
    } catch (error) {
      console.error('✗ Failed to fetch vehicle data:', error.message);
      console.error('Error code:', error.code);
    }

    console.log('\n--- Test 2: Vehicle Specifications (Vehiclespecs) ---');
    try {
      const specs = await CheckCarDetailsClient.getVehicleSpecs(testVRM);
      console.log('✓ Vehicle specs fetched successfully');
      console.log('Specs:', JSON.stringify(specs, null, 2));
    } catch (error) {
      console.error('✗ Failed to fetch vehicle specs:', error.message);
    }

    console.log('\n--- Test 3: Vehicle Valuation (vehiclevaluation) ---');
    try {
      const valuation = await CheckCarDetailsClient.getVehicleValuation(testVRM);
      console.log('✓ Vehicle valuation fetched successfully');
      console.log('Valuation:', JSON.stringify(valuation, null, 2));
    } catch (error) {
      console.error('✗ Failed to fetch vehicle valuation:', error.message);
    }

    console.log('\n--- Test 4: Combined Vehicle Data with Valuation ---');
    try {
      const combined = await CheckCarDetailsClient.getVehicleDataWithValuation(testVRM);
      console.log('✓ Combined data fetched successfully');
      console.log('Combined Data:', JSON.stringify(combined, null, 2));
    } catch (error) {
      console.error('✗ Failed to fetch combined data:', error.message);
    }

    console.log('\n--- Test 5: MOT History (mot) ---');
    try {
      const mot = await CheckCarDetailsClient.getMOTHistory(testVRM);
      console.log('✓ MOT history fetched successfully');
      console.log('MOT:', JSON.stringify(mot, null, 2));
    } catch (error) {
      console.error('✗ Failed to fetch MOT history:', error.message);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n=== Test Complete ===');
}

// Run tests
testCheckCarDetailsAPI()
  .then(() => {
    console.log('\nAll tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest suite failed:', error);
    process.exit(1);
  });
