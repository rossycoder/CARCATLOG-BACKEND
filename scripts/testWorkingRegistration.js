require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testWorkingRegistration() {
  console.log('\n🔍 TESTING MULTIPLE REGISTRATIONS');
  console.log('='.repeat(80));
  
  const dvlaKey = process.env.DVLA_API_KEY;
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  
  // Test multiple registrations
  const registrations = [
    'BD51SMR',  // Known working registration
    'EK14TWX',  // AutoTrader vehicle
    'HUM777A',  // Previous test
    'AB12CDE'   // Random test
  ];
  
  for (const registration of registrations) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${registration}`);
    console.log('='.repeat(80));
    
    // DVLA Test
    console.log('\n📍 DVLA API:');
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
      
      console.log(`✅ SUCCESS - Make: ${dvlaResponse.data.make}, Model: ${dvlaResponse.data.model || 'N/A'}, Year: ${dvlaResponse.data.yearOfManufacture}`);
      
      // Check for running costs fields
      const data = dvlaResponse.data;
      console.log('\n🔍 Running Costs Check:');
      console.log(`  Fuel Economy: ${data.fuelEconomy || data.mpg || 'NOT AVAILABLE'}`);
      console.log(`  Insurance Group: ${data.insuranceGroup || 'NOT AVAILABLE'}`);
      console.log(`  Annual Tax: ${data.annualTax || data.vehicleTax || 'NOT AVAILABLE'}`);
      console.log(`  Previous Owners: ${data.previousOwners || 'NOT AVAILABLE'}`);
      
    } catch (error) {
      console.log(`❌ FAILED - ${error.response?.data?.errors?.[0]?.title || error.message}`);
    }
    
    // CheckCarDetails Test
    console.log('\n📍 CheckCarDetails API:');
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
      
      console.log(`✅ SUCCESS - Make: ${checkCarResponse.data.make}, Model: ${checkCarResponse.data.model}, Year: ${checkCarResponse.data.yearOfManufacture}`);
      
      // Check for running costs fields
      const data = checkCarResponse.data;
      console.log('\n🔍 Running Costs Check:');
      console.log(`  Fuel Economy: ${data.fuelEconomy || data.mpg || 'NOT AVAILABLE'}`);
      console.log(`  Insurance Group: ${data.insuranceGroup || 'NOT AVAILABLE'}`);
      console.log(`  Annual Tax: ${data.annualTax || data.vehicleTax || 'NOT AVAILABLE'}`);
      console.log(`  Previous Owners: ${data.previousOwners || 'NOT AVAILABLE'}`);
      
    } catch (error) {
      console.log(`❌ FAILED - ${error.response?.data?.message || error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testWorkingRegistration();
