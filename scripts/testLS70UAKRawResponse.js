/**
 * Test LS70UAK Raw API Response
 * Check what data CheckCarDetails API actually returns
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const { loadAPICredentials, getActiveAPIKey, getActiveBaseUrl } = require('../config/apiCredentials');

const VRM = 'LS70UAK';

async function testRawResponse() {
  try {
    console.log('🔍 Testing Raw API Response for LS70UAK\n');

    // Initialize client
    const credentials = loadAPICredentials();
    const environment = credentials.environment;
    const apiKey = getActiveAPIKey(credentials.historyAPI, environment);
    const baseUrl = getActiveBaseUrl(credentials.historyAPI, environment);
    const isTestMode = environment === 'test';

    const client = new CheckCarDetailsClient(apiKey, baseUrl, isTestMode);

    // Get raw response
    console.log('📡 Fetching raw carhistorycheck data...\n');
    const rawData = await client.getVehicleHistory(VRM);

    console.log('📦 RAW API RESPONSE:');
    console.log(JSON.stringify(rawData, null, 2));

    console.log('\n\n🔍 Checking for specific fields:');
    console.log('   SmmtDetails:', rawData.SmmtDetails ? 'EXISTS' : 'MISSING');
    console.log('   Consumption:', rawData.Consumption ? 'EXISTS' : 'MISSING');
    console.log('   VehicleReg:', rawData.VehicleRegistration ? 'EXISTS' : 'MISSING');
    console.log('   Engine:', rawData.Engine ? 'EXISTS' : 'MISSING');
    console.log('   General:', rawData.General ? 'EXISTS' : 'MISSING');
    console.log('   Performance:', rawData.Performance ? 'EXISTS' : 'MISSING');
    console.log('   Dimensions:', rawData.Dimensions ? 'EXISTS' : 'MISSING');

    if (rawData.Consumption) {
      console.log('\n📊 Consumption Data:');
      console.log(JSON.stringify(rawData.Consumption, null, 2));
    }

    if (rawData.VehicleRegistration) {
      console.log('\n🚗 VehicleRegistration Data:');
      console.log(JSON.stringify(rawData.VehicleRegistration, null, 2));
    }

    if (rawData.General) {
      console.log('\n📋 General Data:');
      console.log(JSON.stringify(rawData.General, null, 2));
    }

    if (rawData.Performance) {
      console.log('\n⚡ Performance Data:');
      console.log(JSON.stringify(rawData.Performance, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testRawResponse();
