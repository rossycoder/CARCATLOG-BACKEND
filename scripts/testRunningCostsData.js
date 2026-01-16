require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testRunningCostsData() {
  console.log('\n🔍 TESTING RUNNING COSTS DATA - COMPREHENSIVE CHECK');
  console.log('='.repeat(80));
  
  const dvlaKey = process.env.DVLA_API_KEY;
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  
  const registration = 'HUM777A'; // Working registration
  
  console.log(`Testing: ${registration}`);
  console.log('='.repeat(80));
  
  // DVLA Test
  console.log('\n📍 DVLA API - Full Response:');
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
    
    console.log('✅ DVLA SUCCESS!');
    console.log('Full DVLA Response:');
    console.log(JSON.stringify(dvlaResponse.data, null, 2));
    
    // Check ALL fields
    console.log('\n🔍 ALL DVLA Fields:');
    Object.keys(dvlaResponse.data).forEach(key => {
      console.log(`  ${key}: ${dvlaResponse.data[key]}`);
    });
    
  } catch (error) {
    console.log('❌ DVLA ERROR:', error.message);
  }
  
  // CheckCarDetails Test
  console.log('\n\n📍 CheckCarDetails API - Full Response:');
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
    
    console.log('✅ CheckCarDetails SUCCESS!');
    console.log('Full CheckCarDetails Response:');
    console.log(JSON.stringify(checkCarResponse.data, null, 2));
    
    // Check ALL fields
    console.log('\n🔍 ALL CheckCarDetails Fields:');
    Object.keys(checkCarResponse.data).forEach(key => {
      if (typeof checkCarResponse.data[key] === 'object') {
        console.log(`  ${key}:`);
        Object.keys(checkCarResponse.data[key]).forEach(subKey => {
          console.log(`    ${subKey}: ${checkCarResponse.data[key][subKey]}`);
        });
      } else {
        console.log(`  ${key}: ${checkCarResponse.data[key]}`);
      }
    });
    
  } catch (error) {
    console.log('❌ CheckCarDetails ERROR:', error.message);
  }
  
  // Check for Running Costs specific fields
  console.log('\n\n📊 RUNNING COSTS FIELDS CHECK:');
  console.log('='.repeat(80));
  
  const fieldsToCheck = [
    'fuelEconomy',
    'fuelEconomyUrban',
    'fuelEconomyExtraUrban',
    'fuelEconomyCombined',
    'mpg',
    'mpgUrban',
    'mpgExtraUrban',
    'mpgCombined',
    'annualTax',
    'tax',
    'taxAmount',
    'insuranceGroup',
    'insurance',
    'previousOwners',
    'owners',
    'numberOfOwners'
  ];
  
  console.log('\nSearching for these fields in API responses:');
  fieldsToCheck.forEach(field => {
    console.log(`  - ${field}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testRunningCostsData();
