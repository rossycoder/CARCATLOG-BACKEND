/**
 * Debug API Response Structure
 * Shows the actual structure of the API response to find where emission class and MPG are located
 */

require('dotenv').config();
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function debugAPIResponse() {
  try {
    console.log('🔍 Debugging API Response Structure\n');
    
    const client = new CheckCarDetailsClient();
    const vrm = 'NU10YEV'; // SKODA OCTAVIA
    
    console.log(`Testing VRM: ${vrm}\n`);
    
    // Fetch vehicle specs
    console.log('📡 Fetching vehicleSpecs...');
    const specs = await client.getVehicleSpecs(vrm);
    
    console.log('\n📋 FULL API RESPONSE STRUCTURE:');
    console.log(JSON.stringify(specs, null, 2));
    
    console.log('\n\n🔍 SEARCHING FOR KEY FIELDS:');
    
    // Search for emission class
    console.log('\n1. EMISSION CLASS:');
    if (specs.Emissions) {
      console.log('   specs.Emissions:', JSON.stringify(specs.Emissions, null, 2));
    }
    if (specs.VehicleIdentification) {
      console.log('   specs.VehicleIdentification.EmissionClass:', specs.VehicleIdentification.EmissionClass);
    }
    if (specs.SmmtDetails) {
      console.log('   specs.SmmtDetails.EmissionClass:', specs.SmmtDetails.EmissionClass);
    }
    
    // Search for MPG
    console.log('\n2. FUEL ECONOMY (MPG):');
    if (specs.Performance?.FuelEconomy) {
      console.log('   specs.Performance.FuelEconomy:', JSON.stringify(specs.Performance.FuelEconomy, null, 2));
    }
    if (specs.SmmtDetails) {
      console.log('   specs.SmmtDetails.CombinedMpg:', specs.SmmtDetails.CombinedMpg);
      console.log('   specs.SmmtDetails.UrbanColdMpg:', specs.SmmtDetails.UrbanColdMpg);
      console.log('   specs.SmmtDetails.ExtraUrbanMpg:', specs.SmmtDetails.ExtraUrbanMpg);
    }
    
    // Search for insurance group
    console.log('\n3. INSURANCE GROUP:');
    if (specs.ModelData) {
      console.log('   specs.ModelData.InsuranceGroup:', specs.ModelData.InsuranceGroup);
    }
    if (specs.SmmtDetails) {
      console.log('   specs.SmmtDetails.InsuranceGroup:', specs.SmmtDetails.InsuranceGroup);
    }
    
    // Search for CO2
    console.log('\n4. CO2 EMISSIONS:');
    if (specs.Emissions) {
      console.log('   specs.Emissions.ManufacturerCo2:', specs.Emissions.ManufacturerCo2);
    }
    if (specs.VehicleExciseDutyDetails) {
      console.log('   specs.VehicleExciseDutyDetails.DvlaCo2:', specs.VehicleExciseDutyDetails.DvlaCo2);
    }
    if (specs.SmmtDetails) {
      console.log('   specs.SmmtDetails.Co2:', specs.SmmtDetails.Co2);
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error(error.stack);
  }
}

// Run debug
debugAPIResponse();
