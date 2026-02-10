/**
 * Test script to check ONLY vehicle specs data
 * Usage: node test-specs-only.js <registration>
 */

const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');
require('dotenv').config();

async function testVehicleSpecs(registration) {
  console.log(`\n🔍 Fetching Vehicle Specs for: ${registration}\n`);
  console.log('='.repeat(80));

  try {
    const apiKey = process.env.CHECKCARD_API_KEY;
    if (!apiKey) {
      throw new Error('CHECKCARD_API_KEY not found in environment');
    }

    const client = new CheckCarDetailsClient(apiKey);

    // Fetch ONLY Vehicle Specs
    console.log('\n📊 VEHICLE SPECS (from /vehicledata/vehiclespecs):');
    console.log('-'.repeat(80));
    const specs = await client.getVehicleSpecs(registration);
    
    console.log('\n🚗 Basic Information:');
    console.log('  Make:', specs.make);
    console.log('  Model:', specs.model);
    console.log('  Variant:', specs.variant);
    console.log('  Year:', specs.year);
    console.log('  Registration:', specs.registrationNumber || registration);
    
    console.log('\n⚙️  Technical Specs:');
    console.log('  Fuel Type:', specs.fuelType);
    console.log('  Body Type:', specs.bodyType);
    console.log('  Transmission:', specs.transmission);
    console.log('  Doors:', specs.doors);
    console.log('  Seats:', specs.seats);
    console.log('  Engine Size:', specs.engineSize, 'L');
    console.log('  Colour:', specs.colour);
    
    console.log('\n📏 Mileage & MOT:');
    console.log('  Mileage:', specs.mileage || 'N/A');
    console.log('  MOT Status:', specs.motStatus || 'N/A');
    console.log('  MOT Due:', specs.motDue || 'N/A');
    
    console.log('\n🏃 Running Costs:');
    console.log('  Urban MPG:', specs.urbanMpg || 'N/A');
    console.log('  Extra Urban MPG:', specs.extraUrbanMpg || 'N/A');
    console.log('  Combined MPG:', specs.combinedMpg || 'N/A');
    console.log('  CO2 Emissions:', specs.co2Emissions ? `${specs.co2Emissions} g/km` : 'N/A');
    console.log('  Insurance Group:', specs.insuranceGroup || 'N/A');
    console.log('  Annual Tax:', specs.annualTax ? `£${specs.annualTax}` : 'N/A');
    
    if (specs.fuelType === 'Electric') {
      console.log('\n⚡ Electric Vehicle Data:');
      console.log('  Electric Range:', specs.electricRange ? `${specs.electricRange} miles` : 'N/A');
      console.log('  Battery Capacity:', specs.batteryCapacity ? `${specs.batteryCapacity} kWh` : 'N/A');
      console.log('  Charging Time:', specs.chargingTime ? `${specs.chargingTime} hours` : 'N/A');
      console.log('  Home Charging Speed:', specs.homeChargingSpeed ? `${specs.homeChargingSpeed} kW` : 'N/A');
      console.log('  Public Charging Speed:', specs.publicChargingSpeed ? `${specs.publicChargingSpeed} kW` : 'N/A');
      console.log('  Rapid Charging Speed:', specs.rapidChargingSpeed ? `${specs.rapidChargingSpeed} kW` : 'N/A');
    }

    console.log('\n🔧 Performance:');
    console.log('  Power:', specs.power ? `${specs.power} bhp` : 'N/A');
    console.log('  Torque:', specs.torque ? `${specs.torque} Nm` : 'N/A');
    console.log('  0-60 mph:', specs.acceleration ? `${specs.acceleration} seconds` : 'N/A');
    console.log('  Top Speed:', specs.topSpeed ? `${specs.topSpeed} mph` : 'N/A');

    console.log('\n💰 Valuation:');
    console.log('  Dealer Price:', specs.valuation?.dealerPrice ? `£${specs.valuation.dealerPrice}` : 'N/A');
    console.log('  Private Price:', specs.valuation?.privatePrice ? `£${specs.valuation.privatePrice}` : 'N/A');
    console.log('  Part Exchange:', specs.valuation?.partExchangePrice ? `£${specs.valuation.partExchangePrice}` : 'N/A');

    console.log('\n' + '='.repeat(80));
    console.log('✅ Vehicle specs fetched successfully!');

    // Check for missing data
    const missingFields = [];
    if (!specs.variant) missingFields.push('Variant');
    if (!specs.combinedMpg) missingFields.push('Combined MPG');
    if (!specs.co2Emissions) missingFields.push('CO2 Emissions');
    if (!specs.insuranceGroup) missingFields.push('Insurance Group');

    if (missingFields.length > 0) {
      console.log('\n⚠️  Missing Fields:', missingFields.join(', '));
    } else {
      console.log('\n✅ All important fields are present!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
  }
}

// Get registration from command line
const registration = process.argv[2];
if (!registration) {
  console.error('Usage: node test-specs-only.js <registration>');
  console.error('Example: node test-specs-only.js GX65LZP');
  process.exit(1);
}

testVehicleSpecs(registration);
