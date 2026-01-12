/**
 * Test with a valid VRM that should return data
 */

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Test VRMs - using ones that are likely to have data
const TEST_VRMS = [
  'AB12CDE',  // Test mode VRM (contains A)
  'VA21XYZ',  // Test mode VRM (contains A)
  'BD51SMR',  // Real VRM example
  'AA19AAA',  // Test mode VRM (contains A)
];

async function testVRM(vrm) {
  console.log(`\n=== Testing VRM: ${vrm} ===`);
  
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/vehicle-history/mot/${vrm}`,
      {
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS - Data found!');
      console.log('Data:', JSON.stringify(response.data, null, 2));
    } else if (response.status === 404) {
      console.log('⚠️  404 - No data for this VRM');
      console.log('Message:', response.data.error);
    } else {
      console.log(`❌ Error ${response.status}`);
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function main() {
  console.log('Testing MOT History API with various VRMs\n');
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`API Environment: ${process.env.API_ENVIRONMENT || 'test'}`);
  
  for (const vrm of TEST_VRMS) {
    await testVRM(vrm);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }
}

main().catch(console.error);
