require('dotenv').config();
const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');

async function testMA21YOXSpecs() {
  console.log('🔍 Testing MA21YOX Vehicle Specs API\n');
  console.log('='.repeat(70));
  
  const client = new CheckCarDetailsClient();
  const vrm = 'MA21YOX';
  
  try {
    console.log('📡 Calling Vehicle Specs API for:', vrm);
    console.log('='.repeat(70));
    
    const specs = await client.getVehicleSpecs(vrm);
    
    console.log('\n📊 RAW API RESPONSE:');
    console.log('='.repeat(70));
    console.log(JSON.stringify(specs, null, 2));
    console.log('='.repeat(70));
    
    console.log('\n🔍 KEY FIELDS EXTRACTED:');
    console.log('='.repeat(70));
    
    // Vehicle Identification
    console.log('\n📋 VEHICLE IDENTIFICATION:');
    console.log('  Make:', specs.VehicleIdentification?.Make);
    console.log('  Model:', specs.VehicleIdentification?.Model);
    console.log('  Year:', specs.VehicleIdentification?.YearOfManufacture);
    
    // Model Data
    console.log('\n📋 MODEL DATA:');
    console.log('  Make:', specs.ModelData?.Make);
    console.log('  Model:', specs.ModelData?.Model);
    console.log('  Variant:', specs.ModelData?.Variant);
    console.log('  ModelVariant:', specs.ModelData?.ModelVariant);
    console.log('  Fuel Type:', specs.ModelData?.FuelType);
    console.log('  Engine Capacity:', specs.ModelData?.EngineCapacity);
    console.log('  CO2:', specs.ModelData?.CO2Emissions);
    console.log('  Combined MPG:', specs.ModelData?.CombinedMpg);
    
    // SMMT Details
    console.log('\n📋 SMMT DETAILS:');
    if (specs.SmmtDetails) {
      console.log('  Description:', specs.SmmtDetails.Description);
      console.log('  Variant:', specs.SmmtDetails.Variant);
      console.log('  Fuel Type:', specs.SmmtDetails.FuelType);
      console.log('  Engine Capacity:', specs.SmmtDetails.EngineCapacity);
      console.log('  CO2:', specs.SmmtDetails.Co2);
      console.log('  Combined MPG:', specs.SmmtDetails.CombinedMpg);
      console.log('  Transmission:', specs.SmmtDetails.Transmission);
      console.log('  Body Style:', specs.SmmtDetails.BodyStyle);
      console.log('  Doors:', specs.SmmtDetails.NumberOfDoors);
      console.log('  Seats:', specs.SmmtDetails.NumberOfSeats);
    } else {
      console.log('  ❌ No SMMT Details available');
    }
    
    // DVLA Technical Details
    console.log('\n📋 DVLA TECHNICAL DETAILS:');
    console.log('  Engine Capacity (cc):', specs.DvlaTechnicalDetails?.EngineCapacityCc);
    console.log('  Seats:', specs.DvlaTechnicalDetails?.SeatCountIncludingDriver);
    
    // Body Details
    console.log('\n📋 BODY DETAILS:');
    console.log('  Body Style:', specs.BodyDetails?.BodyStyle);
    console.log('  Doors:', specs.BodyDetails?.NumberOfDoors);
    console.log('  Seats:', specs.BodyDetails?.NumberOfSeats);
    
    // Transmission
    console.log('\n📋 TRANSMISSION:');
    console.log('  Type:', specs.Transmission?.TransmissionType);
    
    console.log('\n='.repeat(70));
    console.log('🔍 MHEV DETECTION CHECK:');
    console.log('='.repeat(70));
    
    const model = specs.VehicleIdentification?.Model || specs.ModelData?.Model || '';
    const variant = specs.SmmtDetails?.Variant || specs.ModelData?.Variant || '';
    
    console.log('Model contains MHEV:', model.toUpperCase().includes('MHEV'));
    console.log('Variant contains MHEV:', variant.toUpperCase().includes('MHEV'));
    
    const isMHEV = model.toUpperCase().includes('MHEV') || variant.toUpperCase().includes('MHEV');
    console.log('\n🎯 IS MHEV:', isMHEV ? 'YES ✅' : 'NO ❌');
    
    if (isMHEV) {
      const fuelType = specs.ModelData?.FuelType || '';
      console.log('\n📊 FUEL TYPE LOGIC:');
      console.log('  Raw Fuel Type:', fuelType);
      console.log('  Contains "diesel":', fuelType.toLowerCase().includes('diesel'));
      console.log('  Expected Result: Diesel Hybrid ✅');
    }
    
    console.log('\n='.repeat(70));
    console.log('✅ Test complete');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMA21YOXSpecs();
