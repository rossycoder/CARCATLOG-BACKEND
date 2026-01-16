/**
 * Test script to check if running costs and valuation data are being fetched
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_VRM = 'HUM777A'; // The registration from your console logs

async function testRunningCostsAPI() {
  try {
    console.log('🧪 Testing Enhanced Vehicle Lookup API...\n');
    console.log(`📍 API URL: ${API_BASE_URL}/api/vehicles/enhanced-lookup/${TEST_VRM}\n`);

    const response = await axios.get(
      `${API_BASE_URL}/api/vehicles/enhanced-lookup/${TEST_VRM}`,
      {
        timeout: 15000
      }
    );

    console.log('✅ API Response received\n');
    console.log('📊 Data Sources:', response.data.dataSources);
    console.log('\n💰 Running Costs:');
    console.log(JSON.stringify(response.data.data.runningCosts, null, 2));
    console.log('\n💵 Valuation:');
    console.log(JSON.stringify(response.data.data.valuation, null, 2));
    console.log('\n🔧 Field Sources:');
    console.log(JSON.stringify(response.data.data.fieldSources, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRunningCostsAPI();
