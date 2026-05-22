require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.CHECKCARD_API_KEY;
const baseURL = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
const vrm = process.argv[2] || 'LN67DSO';

console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`Environment: ${process.env.API_ENVIRONMENT}`);
console.log(`Testing VRM: ${vrm}\n`);

async function test() {
  try {
    const url = `${baseURL}/vehicledata/Vehiclespecs`;
    console.log(`Calling: ${url}?vrm=${vrm}`);
    
    const response = await axios.get(url, {
      params: { apikey: apiKey, vrm: vrm.toUpperCase() },
      timeout: 10000
    });

    console.log('\n✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ Failed:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Message:', error.message);
  }
}

test();
