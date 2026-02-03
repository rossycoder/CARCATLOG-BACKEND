const axios = require('axios');

// Load environment variables
require('dotenv').config();

// Test different MOT endpoint names
async function testMOTEndpoints() {
  const baseUrl = 'https://api.checkcardetails.co.uk';
  const apiKey = process.env.CHECKCARD_API_KEY;
  const vrm = 'RJ08PFA';
  
  console.log('Testing different MOT endpoint names...');
  console.log('Base URL:', baseUrl);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
  console.log('VRM:', vrm);
  console.log('=' .repeat(60));
  
  const endpoints = [
    'mot',
    'mothistory', 
    'MOT',
    'MOTHistory',
    'vehiclemot',
    'motdata',
    'motcheck'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting endpoint: ${endpoint}`);
      const url = `${baseUrl}/vehicledata/${endpoint}`;
      
      const response = await axios.get(url, {
        params: {
          apikey: apiKey,
          vrm: vrm
        },
        timeout: 5000
      });
      
      console.log(`✅ SUCCESS: ${endpoint} - Status: ${response.status}`);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      break; // Stop on first success
      
    } catch (error) {
      const status = error.response?.status || 'No response';
      const statusText = error.response?.statusText || error.message;
      console.log(`❌ FAILED: ${endpoint} - Status: ${status} (${statusText})`);
      
      if (error.response?.data) {
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('MOT Endpoint Test Complete');
}

// Run the test
if (require.main === module) {
  testMOTEndpoints();
}

module.exports = testMOTEndpoints;