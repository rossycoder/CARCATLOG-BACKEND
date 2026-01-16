require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function finalTest() {
  console.log('\n🔍 FINAL TEST FOR EK14TWX');
  console.log('='.repeat(80));
  
  const dvlaKey = process.env.DVLA_API_KEY;
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  
  const registrations = ['EK14TWX', 'EK14 TWX', 'HUM777A'];
  
  for (const reg of registrations) {
    console.log('\n' + '='.repeat(80));
    console.log(`Testing: ${reg}`);
    console.log('='.repeat(80));
    
    // DVLA Test
    console.log('\n📍 DVLA API:');
    try {
      const dvlaResponse = await axios.post(
        'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        { registrationNumber: reg },
        {
          headers: {
            'x-api-key': dvlaKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('✅ SUCCESS!');
      console.log('Make:', dvlaResponse.data.make);
      console.log('Year:', dvlaResponse.data.yearOfManufacture);
      console.log('Color:', dvlaResponse.data.colour);
      console.log('Full Response:', JSON.stringify(dvlaResponse.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('❌ FAILED:', error.response.status);
        console.log('Error:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ ERROR:', error.message);
      }
    }
    
    // CheckCarDetails Test
    console.log('\n📍 CheckCarDetails API:');
    try {
      const checkCarResponse = await axios.get(
        `https://api.checkcardetails.co.uk/vehicledata/vehicleregistration`,
        {
          params: {
            apikey: checkCarKey,
            vrm: reg
          },
          timeout: 10000
        }
      );
      
      console.log('✅ SUCCESS!');
      console.log('Make:', checkCarResponse.data.make);
      console.log('Model:', checkCarResponse.data.model);
      console.log('Year:', checkCarResponse.data.yearOfManufacture);
      console.log('Full Response:', JSON.stringify(checkCarResponse.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('❌ FAILED:', error.response.status);
        console.log('Error:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ ERROR:', error.message);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
  
  process.exit(0);
}

finalTest();
