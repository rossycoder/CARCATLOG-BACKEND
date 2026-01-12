/**
 * Test the CheckCarDetails Valuation API directly
 */

const axios = require('axios');
require('dotenv').config();

async function testValuationAPI() {
  const apiKey = process.env.VALUATION_API_LIVE_KEY;
  const baseUrl = process.env.VALUATION_API_BASE_URL;
  const vrm = 'AA19ABC'; // Test VRM with 'A' for test mode
  const mileage = 50000;

  console.log('🧪 Testing CheckCarDetails Valuation API Directly\n');
  console.log('='.repeat(60));
  console.log(`API Key: ${apiKey?.substring(0, 10)}...`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`VRM: ${vrm}`);
  console.log(`Mileage: ${mileage}`);
  console.log('='.repeat(60));

  const url = `${baseUrl}/vehicledata/vehiclevaluation`;
  
  console.log(`\n📡 Making request to: ${url}`);
  console.log(`   Parameters: apikey=${apiKey?.substring(0, 10)}..., vrm=${vrm}, mileage=${mileage}\n`);

  try {
    const response = await axios.get(url, {
      params: {
        apikey: apiKey,
        vrm: vrm,
        mileage: mileage,
      },
      timeout: 10000,
    });

    console.log('✅ SUCCESS!\n');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('\n📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ ERROR!\n');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('\n📦 Response Data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received');
      console.log('Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testValuationAPI();
