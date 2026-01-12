const axios = require('axios');

const API_KEY = '14cedd96eeda4ac6b6b7f9a4db04f573';
const BASE_URL = 'https://api.checkcardetails.co.uk';
const VRM = 'EK12TWX';

async function testAPI() {
  console.log('Testing CheckCarDetails API...');
  console.log('VRM:', VRM);
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('');

  // Try different endpoint formats
  const endpoints = [
    `/vehicledata/carhistorycheck?apikey=${API_KEY}&vrm=${VRM}`,
    `/vehicledata/VehicleRegistration?apikey=${API_KEY}&vrm=${VRM}`,
    `/vehicledata/ukvehicledata?apikey=${API_KEY}&vrm=${VRM}`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${BASE_URL}${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        timeout: 10000,
      });
      console.log('✅ SUCCESS!');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('');
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      console.log('');
    }
  }
}

testAPI();
