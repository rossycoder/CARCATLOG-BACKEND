require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testFullDataFlow() {
  const vrm = 'HUM777A';
  
  console.log('='.repeat(80));
  console.log('FULL DATA FLOW TEST FOR:', vrm);
  console.log('='.repeat(80));
  
  try {
    // Step 1: Get raw Vehiclespecs data
    console.log('\n📦 STEP 1: Fetching Vehiclespecs...');
    const specsData = await CheckCarDetailsClient.getVehicleSpecs(vrm);
    console.log('Specs Data Keys:', Object.keys(specsData));
    console.log('VehicleIdentification:', specsData.VehicleIdentification);
    console.log('ModelData:', specsData.ModelData);
    
    // Step 2: Get raw UKVehicleData
    console.log('\n📦 STEP 2: Fetching UKVehicleData...');
    const ukData = await CheckCarDetailsClient.getUKVehicleData(vrm);
    console.log('UK Data Keys:', Object.keys(ukData));
    console.log('VehicleRegistration:', ukData.VehicleRegistration);
    console.log('VehicleHistory:', ukData.VehicleHistory);
    
    // Step 3: Parse the data
    console.log('\n📦 STEP 3: Parsing data...');
    const parsedData = CheckCarDetailsClient.parseResponse(specsData);
    console.log('Parsed Data:', JSON.stringify(parsedData, null, 2));
    
    // Step 4: Get full vehicle data (which combines both)
    console.log('\n📦 STEP 4: Getting full vehicle data...');
    const fullData = await CheckCarDetailsClient.getVehicleData(vrm);
    console.log('Full Data:', JSON.stringify(fullData, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFullDataFlow();
