/**
 * Test CheckCarDetails History API for EK14TWX
 */

require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.CHECKCARDETAILS_API_KEY || '14cedd96eeda4ac6b6b7f9a4db04f573';
const BASE_URL = 'https://api.checkcardetails.co.uk';
const VRM = 'EK14TWX';

async function testHistoryAPI() {
  console.log('=== Testing CheckCarDetails History API ===\n');
  console.log(`VRM: ${VRM}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test different endpoints
  const endpoints = [
    'ukvehicledata',
    'vehiclespecs',
    'vehicleregistration',
    'mot',
    'mileage'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n--- Testing ${endpoint} endpoint ---`);
    try {
      const url = `${BASE_URL}/vehicledata/${endpoint}`;
      console.log(`URL: ${url}?apikey=***&vrm=${VRM}`);
      
      const response = await axios.get(url, {
        params: {
          apikey: API_KEY,
          vrm: VRM
        },
        timeout: 10000
      });

      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`Response keys:`, Object.keys(response.data));
      
      // Show sample data
      if (endpoint === 'ukvehicledata') {
        console.log('\nSample data:');
        console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
      }
    } catch (error) {
      console.log(`❌ Failed!`);
      console.log(`Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Status Text: ${error.response.statusText}`);
        console.log(`Response:`, error.response.data);
      }
    }
  }
}

testHistoryAPI().catch(console.error);
