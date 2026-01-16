require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

// Test multiple registrations to ensure they all work
const testRegistrations = [
  'HUM777A',
  'EK14TWX',
  'MX08XMT',
  'BD51SMR',
  'AB12CDE' // Test registration
];

async function testAllRegistrations() {
  console.log('='.repeat(80));
  console.log('TESTING ALL REGISTRATIONS');
  console.log('='.repeat(80));
  console.log('API_ENVIRONMENT:', process.env.API_ENVIRONMENT);
  console.log('='.repeat(80));
  console.log('');

  const results = [];

  for (const vrm of testRegistrations) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${vrm}`);
    console.log('='.repeat(80));
    
    try {
      const data = await CheckCarDetailsClient.getVehicleData(vrm);
      
      console.log('✅ SUCCESS');
      console.log('Make:', data.make);
      console.log('Model:', data.model);
      console.log('Year:', data.year);
      console.log('Fuel Type:', data.fuelType);
      console.log('Transmission:', data.transmission);
      console.log('Engine Size:', data.engineSize);
      console.log('Body Type:', data.bodyType);
      console.log('Doors:', data.doors);
      console.log('Seats:', data.seats);
      console.log('Color:', data.color);
      console.log('Previous Owners:', data.previousOwners);
      console.log('Gearbox:', data.gearbox);
      console.log('Emission Class:', data.emissionClass);
      
      results.push({
        vrm,
        status: 'SUCCESS',
        data: {
          make: data.make,
          model: data.model,
          year: data.year,
          fuelType: data.fuelType
        }
      });
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      
      results.push({
        vrm,
        status: 'FAILED',
        error: error.message,
        code: error.code
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log('');
  
  results.forEach(result => {
    if (result.status === 'SUCCESS') {
      console.log(`✅ ${result.vrm}: ${result.data.make} ${result.data.model} (${result.data.year}) - ${result.data.fuelType}`);
    } else {
      console.log(`❌ ${result.vrm}: ${result.error} (${result.code})`);
    }
  });
  
  console.log('='.repeat(80));
}

testAllRegistrations().catch(console.error);
