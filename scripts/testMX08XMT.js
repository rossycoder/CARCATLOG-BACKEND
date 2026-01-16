require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testMX08XMT() {
  console.log('\n🔍 TESTING MX08XMT - COMPLETE CHECK');
  console.log('='.repeat(80));
  
  const dvlaKey = process.env.DVLA_API_KEY;
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  
  const registration = 'MX08XMT';
  
  console.log(`Testing Registration: ${registration}`);
  console.log('='.repeat(80));
  
  // 1. DVLA API Test
  console.log('\n📍 1. DVLA API:');
  console.log('-'.repeat(80));
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
    
    console.log('✅ DVLA API SUCCESS!');
    console.log('\nFull Response:');
    console.log(JSON.stringify(dvlaResponse.data, null, 2));
    
    console.log('\n🔍 Available Fields:');
    Object.keys(dvlaResponse.data).forEach(key => {
      console.log(`  ${key}: ${dvlaResponse.data[key]}`);
    });
    
    console.log('\n🔍 Running Costs Check:');
    const data = dvlaResponse.data;
    console.log(`  Fuel Economy Urban: ${data.fuelEconomyUrban || data.mpgUrban || 'NOT AVAILABLE'}`);
    console.log(`  Fuel Economy Extra Urban: ${data.fuelEconomyExtraUrban || data.mpgExtraUrban || 'NOT AVAILABLE'}`);
    console.log(`  Fuel Economy Combined: ${data.fuelEconomyCombined || data.mpgCombined || 'NOT AVAILABLE'}`);
    console.log(`  Insurance Group: ${data.insuranceGroup || 'NOT AVAILABLE'}`);
    console.log(`  Annual Tax: ${data.annualTax || data.vehicleTax || 'NOT AVAILABLE'}`);
    console.log(`  Previous Owners: ${data.previousOwners || data.numberOfOwners || 'NOT AVAILABLE'}`);
    
  } catch (error) {
    console.log('❌ DVLA API ERROR:', error.response?.data || error.message);
  }
  
  // 2. CheckCarDetails API Test
  console.log('\n\n📍 2. CheckCarDetails API:');
  console.log('-'.repeat(80));
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
    
    console.log('✅ CheckCarDetails API SUCCESS!');
    console.log('\nFull Response:');
    console.log(JSON.stringify(checkCarResponse.data, null, 2));
    
    console.log('\n🔍 Available Fields:');
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
    
    console.log('\n🔍 Running Costs Check:');
    const data = checkCarResponse.data;
    console.log(`  Fuel Economy Urban: ${data.fuelEconomyUrban || data.mpgUrban || 'NOT AVAILABLE'}`);
    console.log(`  Fuel Economy Extra Urban: ${data.fuelEconomyExtraUrban || data.mpgExtraUrban || 'NOT AVAILABLE'}`);
    console.log(`  Fuel Economy Combined: ${data.fuelEconomyCombined || data.mpgCombined || 'NOT AVAILABLE'}`);
    console.log(`  Insurance Group: ${data.insuranceGroup || 'NOT AVAILABLE'}`);
    console.log(`  Annual Tax: ${data.annualTax || data.vehicleTax || 'NOT AVAILABLE'}`);
    console.log(`  Previous Owners: ${data.previousOwners || data.numberOfOwners || 'NOT AVAILABLE'}`);
    
  } catch (error) {
    console.log('❌ CheckCarDetails API ERROR:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('Registration: MX08XMT');
  console.log('Status: Testing complete');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testMX08XMT();
