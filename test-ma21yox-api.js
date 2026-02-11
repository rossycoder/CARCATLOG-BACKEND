require('dotenv').config();
const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');

async function testMA21YOX() {
  console.log('🔍 Testing MA21YOX API Response\n');
  
  const client = new CheckCarDetailsClient();
  const vrm = 'MA21YOX';
  
  try {
    // Test Vehicle Specs API
    console.log('📡 Calling Vehicle Specs API...');
    const specs = await client.getVehicleSpecs(vrm);
    
    console.log('\n📊 RAW API RESPONSE:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(specs, null, 2));
    console.log('='.repeat(60));
    
    console.log('\n🔍 KEY FIELDS:');
    console.log('Make:', specs.VehicleIdentification?.Make);
    console.log('Model:', specs.VehicleIdentification?.Model);
    console.log('Variant:', specs.ModelData?.Variant);
    console.log('Fuel Type:', specs.ModelData?.FuelType);
    console.log('Engine Size:', specs.ModelData?.EngineCapacity);
    console.log('CO2:', specs.ModelData?.CO2Emissions);
    console.log('Combined MPG:', specs.ModelData?.CombinedMpg);
    
    console.log('\n🔍 SMMT DETAILS:');
    if (specs.SmmtDetails) {
      console.log('Description:', specs.SmmtDetails.Description);
      console.log('Fuel Type:', specs.SmmtDetails.FuelType);
      console.log('Engine Size:', specs.SmmtDetails.EngineCapacity);
      console.log('CO2:', specs.SmmtDetails.CO2);
    }
    
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMA21YOX();
