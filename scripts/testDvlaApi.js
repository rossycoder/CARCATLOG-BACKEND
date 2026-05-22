require('dotenv').config();
const axios = require('axios');

async function testDvla() {
  const apiKey = process.env.DVLA_API_KEY;
  const apiUrl = process.env.DVLA_API_URL || 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

  console.log('DVLA_API_KEY:', apiKey ? `SET (${apiKey.substring(0, 8)}...)` : '❌ NOT SET');
  console.log('DVLA_API_URL:', apiUrl);
  console.log('');

  // Test with a known UK reg
  const testReg = process.argv[2] || 'MA57LDL';
  console.log(`Testing with reg: ${testReg}`);

  try {
    const response = await axios.post(
      apiUrl,
      { registrationNumber: testReg.replace(/\s/g, '').toUpperCase() },
      {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    console.log('\n✅ DVLA API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\nColour field:', response.data.colour || '❌ NOT RETURNED');
  } catch (error) {
    if (error.response) {
      console.log(`\n❌ HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('→ API key is invalid or expired');
      } else if (error.response.status === 404) {
        console.log('→ Vehicle not found');
      }
    } else {
      console.log(`\n❌ Network error: ${error.message}`);
    }
  }
}

testDvla();
