require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testRegistration(reg, description) {
  console.log('');
  console.log('='.repeat(80));
  console.log(`Testing: ${reg} (${description})`);
  console.log('='.repeat(80));
  
  const dvlaKey = process.env.DVLA_API_KEY;
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  
  // Test DVLA
  console.log('\n📍 DVLA API:');
  try {
    const dvlaResponse = await axios.post(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      { registrationNumber: reg },
      {
        headers: {
          'x-api-key': dvlaKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('Make:', dvlaResponse.data.make);
    console.log('Model:', dvlaResponse.data.model || 'Not provided');
    console.log('Year:', dvlaResponse.data.yearOfManufacture);
    console.log('Color:', dvlaResponse.data.colour);
    console.log('Fuel:', dvlaResponse.data.fuelType);
    console.log('Engine:', dvlaResponse.data.engineCapacity + 'cc');
  } catch (error) {
    if (error.response) {
      console.log('❌ FAILED:', error.response.status);
      console.log('Message:', error.response.data.errors?.[0]?.title || error.response.data.message);
    } else {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  // Test CheckCarDetails
  console.log('\n📍 CheckCarDetails API:');
  try {
    const checkCarResponse = await axios.get(
      `https://api.checkcardetails.co.uk/vehicledata/vehicleregistration`,
      {
        params: {
          apikey: checkCarKey,
          vrm: reg
        }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('Make:', checkCarResponse.data.make);
    console.log('Model:', checkCarResponse.data.model);
    console.log('Year:', checkCarResponse.data.yearOfManufacture);
    console.log('Color:', checkCarResponse.data.colour);
    console.log('Fuel:', checkCarResponse.data.fuelType);
    console.log('Engine:', checkCarResponse.data.engineCapacity + 'cc');
  } catch (error) {
    if (error.response) {
      console.log('❌ FAILED:', error.response.status);
      console.log('Message:', error.response.data.message);
    } else {
      console.log('❌ ERROR:', error.message);
    }
  }
}

async function runTests() {
  console.log('\n🚗 TESTING CLIENT REGISTRATION NUMBERS\n');
  
  // Test EK14TWX variations
  await testRegistration('EK14TWX', 'No space');
  await testRegistration('EK14 TWX', 'With space');
  await testRegistration('Ek14 twx', 'Lowercase with space');
  
  // Test HUM777A variations
  await testRegistration('HUM777A', 'No space');
  await testRegistration('HUM 777A', 'With space');
  await testRegistration('Hum 777a', 'Lowercase with space');
  
  console.log('\n');
  console.log('='.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(80));
  
  process.exit(0);
}

runTests();
