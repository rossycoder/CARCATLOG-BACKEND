require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testDVLA() {
  const registration = 'AB12CDE'; // Test format
  const apiKey = process.env.DVLA_API_KEY;
  
  console.log('Testing DVLA API...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  console.log('Registration:', registration);
  console.log('');
  
  try {
    const response = await axios.post(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      { registrationNumber: registration },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ DVLA API Success!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ DVLA API Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log(error.message);
    }
  }
  
  process.exit(0);
}

testDVLA();
