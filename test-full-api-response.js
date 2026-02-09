/**
 * Test: Get full API response to see all available fields
 */

require('dotenv').config();
const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');
const fs = require('fs');

async function testFullAPIResponse() {
  console.log('Fetching full API response...\n');

  const testVRM = 'AY10AYL';

  try {
    const client = new CheckCarDetailsClient();
    
    // Get Vehicle Specs
    console.log('Fetching Vehiclespecs...');
    const specsData = await client.getVehicleSpecs(testVRM);
    
    // Save to file for inspection
    fs.writeFileSync(
      'api-response-vehiclespecs.json',
      JSON.stringify(specsData, null, 2)
    );
    
    console.log('✅ Response saved to: api-response-vehiclespecs.json');
    console.log();
    
    // Check for SmmtDetails
    if (specsData.SmmtDetails) {
      console.log('✅ SmmtDetails found!');
      console.log(JSON.stringify(specsData.SmmtDetails, null, 2));
    } else {
      console.log('❌ SmmtDetails NOT found in response');
      console.log();
      console.log('Available top-level fields:');
      console.log(Object.keys(specsData));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullAPIResponse();
