/**
 * Test script to compare vehicle specs vs vehicle history data
 * Usage: node test-vehicle-data-compare.js <registration>
 */

const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');
require('dotenv').config();

async function compareVehicleData(registration) {
  console.log(`\n🔍 Comparing Vehicle Data for: ${registration}\n`);
  console.log('='.repeat(80));

  try {
    const apiKey = process.env.CHECKCARD_API_KEY;
    if (!apiKey) {
      throw new Error('CHECKCARD_API_KEY not found in environment');
    }

    const client = new CheckCarDetailsClient(apiKey);

    // 1. Fetch Vehicle Specs
    console.log('\n📊 VEHICLE SPECS (from /vehicledata/vehiclespecs):');
    console.log('-'.repeat(80));
    const specs = await client.getVehicleSpecs(registration);
    
    console.log('Make:', specs.make);
    console.log('Model:', specs.model);
    console.log('Variant:', specs.variant);
    console.log('Year:', specs.year);
    console.log('Fuel Type:', specs.fuelType);
    console.log('Body Type:', specs.bodyType);
    console.log('Transmission:', specs.transmission);
    console.log('Doors:', specs.doors);
    console.log('Seats:', specs.seats);
    console.log('Engine Size:', specs.engineSize, 'L');
    console.log('Mileage:', specs.mileage);
    console.log('\n🏃 Running Costs:');
    console.log('  Urban MPG:', specs.urbanMpg);
    console.log('  Extra Urban MPG:', specs.extraUrbanMpg);
    console.log('  Combined MPG:', specs.combinedMpg);
    console.log('  CO2 Emissions:', specs.co2Emissions, 'g/km');
    console.log('  Insurance Group:', specs.insuranceGroup);
    console.log('  Annual Tax:', specs.annualTax);
    
    if (specs.fuelType === 'Electric') {
      console.log('\n⚡ Electric Vehicle Data:');
      console.log('  Electric Range:', specs.electricRange, 'miles');
      console.log('  Battery Capacity:', specs.batteryCapacity, 'kWh');
      console.log('  Charging Time:', specs.chargingTime, 'hours');
    }

    // 2. Fetch Vehicle History
    console.log('\n\n📜 VEHICLE HISTORY (from /vehicledata/history):');
    console.log('-'.repeat(80));
    const history = await client.checkHistory(registration);
    
    console.log('Make:', history.make);
    console.log('Model:', history.model);
    console.log('Variant:', history.variant);
    console.log('Year:', history.yearOfManufacture);
    console.log('Fuel Type:', history.fuelType);
    console.log('Body Type:', history.bodyType);
    console.log('Transmission:', history.transmission);
    console.log('Colour:', history.colour);
    console.log('VIN:', history.vin);
    console.log('Engine Number:', history.engineNumber);
    console.log('\n📊 History Details:');
    console.log('  Previous Owners:', history.numberOfPreviousKeepers);
    console.log('  Plate Changes:', history.plateChanges);
    console.log('  Colour Changes:', history.colourChanges);
    console.log('  Write-off Category:', history.writeOffCategory);
    console.log('  MOT Status:', history.motStatus);
    console.log('  MOT Expiry:', history.motExpiryDate);

    // 3. Fetch MOT History
    console.log('\n\n🔧 MOT HISTORY:');
    console.log('-'.repeat(80));
    const mot = await client.getMOTHistory(registration);
    
    if (mot && mot.tests && mot.tests.length > 0) {
      console.log(`Total MOT Tests: ${mot.tests.length}`);
      console.log('\nLatest MOT Test:');
      const latest = mot.tests[0];
      console.log('  Test Date:', latest.testDate);
      console.log('  Result:', latest.testResult);
      console.log('  Expiry Date:', latest.expiryDate);
      console.log('  Mileage:', latest.odometerValue, latest.odometerUnit);
      console.log('  Defects:', latest.defects?.length || 0);
    } else {
      console.log('No MOT history available');
    }

    // 4. Compare Data
    console.log('\n\n✅ DATA COMPARISON:');
    console.log('='.repeat(80));
    
    const comparisons = [
      { field: 'Make', specs: specs.make, history: history.make },
      { field: 'Model', specs: specs.model, history: history.model },
      { field: 'Variant', specs: specs.variant, history: history.variant },
      { field: 'Year', specs: specs.year, history: history.yearOfManufacture },
      { field: 'Fuel Type', specs: specs.fuelType, history: history.fuelType },
      { field: 'Body Type', specs: specs.bodyType, history: history.bodyType },
      { field: 'Transmission', specs: specs.transmission, history: history.transmission },
    ];

    let allMatch = true;
    comparisons.forEach(({ field, specs: specsVal, history: historyVal }) => {
      const match = specsVal === historyVal;
      const icon = match ? '✅' : '❌';
      console.log(`${icon} ${field}:`);
      console.log(`   Specs:   ${specsVal}`);
      console.log(`   History: ${historyVal}`);
      if (!match) {
        allMatch = false;
      }
    });

    console.log('\n' + '='.repeat(80));
    if (allMatch) {
      console.log('✅ ALL DATA MATCHES - Vehicle specs and history are consistent!');
    } else {
      console.log('⚠️  SOME DATA MISMATCHES - Please review the differences above');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

// Get registration from command line
const registration = process.argv[2];
if (!registration) {
  console.error('Usage: node test-vehicle-data-compare.js <registration>');
  process.exit(1);
}

compareVehicleData(registration);
