const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testExtraction() {
  try {
    console.log('Testing model variant extraction for BMW AV13NFC...\n');
    
    const data = await CheckCarDetailsClient.getVehicleData('AV13NFC');
    
    console.log('=== EXTRACTED DATA ===');
    console.log('Make:', data.make);
    console.log('Model:', data.model);
    console.log('Model Variant:', data.modelVariant);
    console.log('\n=== FULL DATA ===');
    console.log(JSON.stringify(data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testExtraction();
