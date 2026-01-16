/**
 * Test DVLA API for HUM777A
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dvlaService = require('../services/dvlaService');

const VRM = 'HUM777A';

async function testDVLA() {
  try {
    console.log('Testing DVLA API for:', VRM);
    console.log('='.repeat(80));
    
    const data = await dvlaService.lookupVehicle(VRM);
    
    console.log('\nDVLA Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('Key Fields:');
    console.log('Make:', data.make);
    console.log('Model:', data.model);
    console.log('Year:', data.yearOfManufacture);
    console.log('Color:', data.colour);
    console.log('Fuel Type:', data.fuelType);
    console.log('Transmission:', data.transmission);
    console.log('Engine Size:', data.engineCapacity);
    console.log('Body Type:', data.typeApproval);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDVLA();
