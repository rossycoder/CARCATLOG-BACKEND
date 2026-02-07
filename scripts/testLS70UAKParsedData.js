/**
 * Test LS70UAK Parsed Data
 * Check what data is returned after parsing
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

const VRM = 'LS70UAK';

async function testParsedData() {
  try {
    console.log('🔍 Testing Parsed Data for LS70UAK\n');

    const client = new CheckCarDetailsClient();
    
    // Get raw data
    console.log('📡 Fetching raw data...');
    const rawData = await client.getUKVehicleData(VRM);
    
    // Parse data
    console.log('🔄 Parsing data...\n');
    const parsedData = client.parseResponse(rawData);

    console.log('📊 PARSED DATA:');
    console.log('=' .repeat(60));
    console.log(`Make: ${parsedData.make}`);
    console.log(`Model: ${parsedData.model}`);
    console.log(`Variant: ${parsedData.variant}`);
    console.log(`Transmission: ${parsedData.transmission}`);
    console.log(`Seats: ${parsedData.seats}`);
    console.log(`Doors: ${parsedData.doors}`);
    console.log(`Emission Class: ${parsedData.emissionClass}`);
    console.log(`\n💰 RUNNING COSTS:`);
    console.log(`Urban MPG: ${parsedData.urbanMpg}`);
    console.log(`Extra Urban MPG: ${parsedData.extraUrbanMpg}`);
    console.log(`Combined MPG: ${parsedData.combinedMpg}`);
    console.log(`Annual Tax: £${parsedData.annualTax}`);
    console.log(`Insurance Group: ${parsedData.insuranceGroup}`);
    console.log(`CO2 Emissions: ${parsedData.co2Emissions}g/km`);

    console.log('\n\n📋 FULL PARSED OBJECT:');
    console.log(JSON.stringify(parsedData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testParsedData();
