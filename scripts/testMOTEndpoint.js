/**
 * Test MOT History Endpoint
 * Tests the MOT history API endpoint to diagnose 500 errors
 */

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_VRM = 'PO59WRT'; // The VRM from the error logs

async function testMOTEndpoint() {
  console.log('=== Testing MOT History Endpoint ===\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test VRM: ${TEST_VRM}\n`);

  try {
    console.log('Making request to MOT endpoint...');
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicle-history/mot/${TEST_VRM}`,
      {
        timeout: 15000,
        validateStatus: () => true, // Don't throw on any status
      }
    );

    console.log(`\nResponse Status: ${response.status}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (response.status === 500) {
      console.log('\n❌ 500 ERROR DETECTED');
      console.log('Error details:', response.data);
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS');
    } else {
      console.log(`\n⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.error('\n❌ Request failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function testVehicleCheckEndpoint() {
  console.log('\n\n=== Testing Vehicle Check Endpoint ===\n');
  
  try {
    console.log('Making request to vehicle check endpoint...');
    const response = await axios.post(
      `${BACKEND_URL}/api/vehicle-history/check`,
      { vrm: TEST_VRM },
      {
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    console.log(`\nResponse Status: ${response.status}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (response.status === 500) {
      console.log('\n❌ 500 ERROR DETECTED');
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS');
    }
  } catch (error) {
    console.error('\n❌ Request failed:');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function checkEnvironmentVariables() {
  console.log('\n\n=== Checking Environment Variables ===\n');
  
  const requiredVars = [
    'CHECKCARDETAILS_API_KEY',
    'CHECKCARDETAILS_API_URL',
    'CHECKCARDETAILS_HISTORY_API_URL',
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 30)}...`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
    }
  });
}

async function main() {
  await checkEnvironmentVariables();
  await testMOTEndpoint();
  await testVehicleCheckEndpoint();
}

main().catch(console.error);
