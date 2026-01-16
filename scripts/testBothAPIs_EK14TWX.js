require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testBothAPIs() {
  const registration = 'AB12CDE'; // Valid test registration
  
  console.log('='.repeat(80));
  console.log('Testing EK14TWX with both APIs');
  console.log('='.repeat(80));
  console.log('');
  
  // Test DVLA API
  console.log('1️⃣  TESTING DVLA API');
  console.log('-'.repeat(80));
  const dvlaKey = process.env.DVLA_API_KEY;
  console.log('API Key:', dvlaKey ? `${dvlaKey.substring(0, 10)}...` : 'MISSING');
  
  try {
    const dvlaResponse = await axios.post(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      { registrationNumber: registration },
      {
        headers: {
          'x-api-key': dvlaKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ DVLA API Success!');
    console.log(JSON.stringify(dvlaResponse.data, null, 2));
  } catch (error) {
    console.log('❌ DVLA API Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
  }
  
  console.log('');
  console.log('');
  
  // Test CheckCarDetails API
  console.log('2️⃣  TESTING CHECKCARDETAILS API');
  console.log('-'.repeat(80));
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  const apiEnv = process.env.API_ENVIRONMENT;
  console.log('API Key:', checkCarKey ? `${checkCarKey.substring(0, 10)}...` : 'MISSING');
  console.log('Environment:', apiEnv);
  
  try {
    const checkCarResponse = await axios.get(
      `https://api.checkcardetails.co.uk/vehicledata/vehicleregistration`,
      {
        params: {
          apikey: checkCarKey,
          vrm: registration
        }
      }
    );
    
    console.log('✅ CheckCarDetails API Success!');
    console.log(JSON.stringify(checkCarResponse.data, null, 2));
  } catch (error) {
    console.log('❌ CheckCarDetails API Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
  }
  
  console.log('');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testBothAPIs();
