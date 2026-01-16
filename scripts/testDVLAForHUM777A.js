/**
 * Test DVLA API directly for HUM777A
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dvlaService = require('../services/dvlaService');

async function testDVLA() {
  try {
    const testReg = 'HUM777A';
    
    console.log(`🚗 Testing DVLA API for: ${testReg}\n`);
    console.log('='.repeat(80));
    
    const data = await dvlaService.lookupVehicle(testReg);
    
    console.log('\n✅ DVLA API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Key Fields:');
    console.log('='.repeat(80));
    console.log(`Make: ${data.make || 'N/A'}`);
    console.log(`Model: ${data.model || 'N/A'}`);
    console.log(`Model Variant: ${data.modelVariant || 'N/A'}`);
    console.log(`Year: ${data.yearOfManufacture || 'N/A'}`);
    console.log(`Color: ${data.colour || 'N/A'}`);
    console.log(`Fuel Type: ${data.fuelType || 'N/A'}`);
    console.log(`Transmission: ${data.transmission || 'N/A'}`);
    console.log(`Engine Capacity: ${data.engineCapacity || 'N/A'}`);
    console.log(`Body Type: ${data.bodyType || 'N/A'}`);
    console.log(`Type Approval: ${data.typeApproval || 'N/A'}`);
    console.log(`CO2 Emissions: ${data.co2Emissions || 'N/A'}`);
    console.log(`Tax Status: ${data.taxStatus || 'N/A'}`);
    console.log(`MOT Status: ${data.motStatus || 'N/A'}`);
    console.log(`MOT Expiry: ${data.motExpiryDate || 'N/A'}`);
    
  } catch (error) {
    console.error('\n❌ DVLA API Error:');
    console.error(`Message: ${error.message}`);
    console.error(error);
  }
}

testDVLA();
