const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testBMWAPI() {
  try {
    console.log('Testing API for BMW AV13NFC...\n');
    
    const response = await checkCarDetailsClient.getVehicleSpecs('AV13NFC');
    
    console.log('=== RAW API RESPONSE ===');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n=== KEY FIELDS ===');
    console.log('Make:', response.make);
    console.log('Model:', response.model);
    console.log('ModelVariant:', response.modelVariant);
    console.log('Submodel:', response.submodel);
    console.log('Trim:', response.trim);
    console.log('Description:', response.description);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testBMWAPI();
