/**
 * Test script to check if Valuation API is working
 */

const ValuationAPIClient = require('../clients/ValuationAPIClient');

const TEST_VRM = 'HUM777A';

async function testValuationAPI() {
  try {
    console.log('🧪 Testing Valuation API directly...\n');
    console.log(`📍 VRM: ${TEST_VRM}\n`);

    const data = await ValuationAPIClient.getValuation(TEST_VRM);

    console.log('✅ Valuation API Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testValuationAPI();
