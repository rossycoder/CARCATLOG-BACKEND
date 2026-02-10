/**
 * Test script to see RAW API response from vehicle specs
 * Usage: node test-raw-specs-api.js <registration>
 */

const axios = require('axios');
require('dotenv').config();

async function testRawAPI(registration) {
  console.log(`\n🔍 Fetching RAW API Response for: ${registration}\n`);
  console.log('='.repeat(80));

  try {
    const apiKey = process.env.CHECKCARD_API_KEY;
    if (!apiKey) {
      throw new Error('CHECKCARD_API_KEY not found in environment');
    }

    const url = `https://api.checkcardetails.co.uk/vehicledata/Vehiclespecs`;
    
    console.log('API URL:', url);
    console.log('VRM:', registration);
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('\n📡 Making API request...\n');

    const response = await axios.get(url, {
      params: {
        apikey: apiKey,
        vrm: registration.toUpperCase()
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response Status:', response.status);
    console.log('\n📦 RAW API RESPONSE:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('='.repeat(80));

    // Check specific fields
    const data = response.data;
    console.log('\n🔍 CHECKING KEY FIELDS:');
    console.log('-'.repeat(80));
    
    if (data.VehicleIdentification) {
      console.log('\n✅ VehicleIdentification found:');
      console.log('  DvlaMake:', data.VehicleIdentification.DvlaMake);
      console.log('  DvlaModel:', data.VehicleIdentification.DvlaModel);
      console.log('  YearOfManufacture:', data.VehicleIdentification.YearOfManufacture);
      console.log('  DvlaFuelType:', data.VehicleIdentification.DvlaFuelType);
      console.log('  DvlaBodyType:', data.VehicleIdentification.DvlaBodyType);
    }

    if (data.ModelData) {
      console.log('\n✅ ModelData found:');
      console.log('  Make:', data.ModelData.Make);
      console.log('  Model:', data.ModelData.Model);
      console.log('  Range:', data.ModelData.Range);
      console.log('  FuelType:', data.ModelData.FuelType);
    }

    if (data.SmmtDetails) {
      console.log('\n✅ SmmtDetails found:');
      console.log('  Range:', data.SmmtDetails.Range);
      console.log('  CombinedMpg:', data.SmmtDetails.CombinedMpg);
      console.log('  UrbanColdMpg:', data.SmmtDetails.UrbanColdMpg);
      console.log('  ExtraUrbanMpg:', data.SmmtDetails.ExtraUrbanMpg);
      console.log('  Co2:', data.SmmtDetails.Co2);
      console.log('  InsuranceGroup:', data.SmmtDetails.InsuranceGroup);
      console.log('  Transmission:', data.SmmtDetails.Transmission);
      console.log('  BodyStyle:', data.SmmtDetails.BodyStyle);
      console.log('  NumberOfDoors:', data.SmmtDetails.NumberOfDoors);
      console.log('  NumberOfSeats:', data.SmmtDetails.NumberOfSeats);
    }

    if (data.DvlaTechnicalDetails) {
      console.log('\n✅ DvlaTechnicalDetails found:');
      console.log('  EngineCapacityCc:', data.DvlaTechnicalDetails.EngineCapacityCc);
      console.log('  SeatCountIncludingDriver:', data.DvlaTechnicalDetails.SeatCountIncludingDriver);
    }

    if (data.BodyDetails) {
      console.log('\n✅ BodyDetails found:');
      console.log('  BodyStyle:', data.BodyDetails.BodyStyle);
      console.log('  NumberOfDoors:', data.BodyDetails.NumberOfDoors);
      console.log('  NumberOfSeats:', data.BodyDetails.NumberOfSeats);
    }

    if (data.Performance) {
      console.log('\n✅ Performance found:');
      if (data.Performance.FuelEconomy) {
        console.log('  FuelEconomy.CombinedMpg:', data.Performance.FuelEconomy.CombinedMpg);
        console.log('  FuelEconomy.UrbanColdMpg:', data.Performance.FuelEconomy.UrbanColdMpg);
        console.log('  FuelEconomy.ExtraUrbanMpg:', data.Performance.FuelEconomy.ExtraUrbanMpg);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Get registration from command line
const registration = process.argv[2];
if (!registration) {
  console.error('Usage: node test-raw-specs-api.js <registration>');
  console.error('Example: node test-raw-specs-api.js GX65LZP');
  process.exit(1);
}

testRawAPI(registration);
