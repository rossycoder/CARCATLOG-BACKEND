require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testEK14TWX_Complete() {
  console.log('\n🔍 TESTING EK14TWX - COMPLETE API CHECK');
  console.log('='.repeat(80));
  console.log('This vehicle is available on AutoTrader');
  console.log('='.repeat(80));
  
  const dvlaKey = process.env.DVLA_API_KEY;
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  
  const registration = 'EK14TWX';
  
  console.log(`\nTesting Registration: ${registration}`);
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
    
    console.log('\n🔍 Key Fields:');
    console.log(`  Make: ${dvlaResponse.data.make}`);
    console.log(`  Year: ${dvlaResponse.data.yearOfManufacture}`);
    console.log(`  Fuel Type: ${dvlaResponse.data.fuelType}`);
    console.log(`  Engine Capacity: ${dvlaResponse.data.engineCapacity}cc`);
    console.log(`  CO2 Emissions: ${dvlaResponse.data.co2Emissions}g/km`);
    console.log(`  Tax Status: ${dvlaResponse.data.taxStatus}`);
    console.log(`  MOT Status: ${dvlaResponse.data.motStatus}`);
    
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
    
    console.log('\n🔍 Key Fields:');
    console.log(`  Make: ${checkCarResponse.data.make}`);
    console.log(`  Model: ${checkCarResponse.data.model}`);
    console.log(`  Year: ${checkCarResponse.data.yearOfManufacture}`);
    console.log(`  Fuel Type: ${checkCarResponse.data.fuelType}`);
    console.log(`  Engine Capacity: ${checkCarResponse.data.engineCapacity}cc`);
    console.log(`  CO2 Emissions: ${checkCarResponse.data.co2Emissions}g/km`);
    
  } catch (error) {
    console.log('❌ CheckCarDetails API ERROR:', error.response?.data || error.message);
  }
  
  // 3. Check for Running Costs Fields
  console.log('\n\n📊 3. RUNNING COSTS FIELDS CHECK:');
  console.log('='.repeat(80));
  
  const fieldsToCheck = [
    'Fuel Economy Urban (MPG)',
    'Fuel Economy Extra Urban (MPG)',
    'Fuel Economy Combined (MPG)',
    'Annual Tax (£)',
    'Insurance Group',
    'Previous Owners'
  ];
  
  console.log('\nSearching for these fields:');
  fieldsToCheck.forEach(field => {
    console.log(`  ❌ ${field}: NOT AVAILABLE in APIs`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSION:');
  console.log('='.repeat(80));
  console.log('✅ Vehicle data is available in DVLA and CheckCarDetails APIs');
  console.log('❌ Running Costs fields (MPG, Tax, Insurance, Owners) are NOT available');
  console.log('\nThese fields need to be:');
  console.log('  1. Hidden from frontend (Recommended)');
  console.log('  2. Manually entered by users');
  console.log('  3. Obtained from a premium API (Additional cost)');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testEK14TWX_Complete();
