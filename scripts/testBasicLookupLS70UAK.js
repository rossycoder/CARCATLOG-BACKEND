/**
 * Test Basic Lookup for LS70UAK
 * Tests the lightweightVehicleService directly
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const lightweightVehicleService = require('../services/lightweightVehicleService');

const VRM = 'LS70UAK';
const MILEAGE = 2500;

async function testBasicLookup() {
  try {
    console.log('🧪 Testing Basic Lookup for LS70UAK\n');
    console.log(`Registration: ${VRM}`);
    console.log(`Mileage: ${MILEAGE}\n`);

    const result = await lightweightVehicleService.getBasicVehicleDataForCarFinder(VRM, MILEAGE);

    console.log('\n📊 RESULT:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`   Make/Model: ${result.data.make} ${result.data.model}`);
      console.log(`   Variant: ${result.data.variant || 'N/A'}`);
      console.log(`   Transmission: ${result.data.transmission || 'N/A'}`);
      console.log(`   Emission Class: ${result.data.emissionClass || 'N/A'}`);
      console.log(`   Urban MPG: ${result.data.urbanMpg || 'N/A'}`);
      console.log(`   Combined MPG: ${result.data.combinedMpg || 'N/A'}`);
      console.log(`   Annual Tax: £${result.data.annualTax || 'N/A'}`);
      console.log(`\n   API Provider: ${result.data.apiProvider}`);
      console.log(`   From Cache: ${result.fromCache}`);
      console.log(`   API Calls: ${result.apiCalls}`);
      console.log(`   Cost: £${result.cost}`);
    } else {
      console.log('\n❌ FAILED!');
      console.log(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testBasicLookup();
