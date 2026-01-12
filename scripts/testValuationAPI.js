/**
 * Test Valuation API
 * Tests the CheckCarDetails valuation endpoint
 */

require('dotenv').config();
const ValuationAPIClient = require('../clients/ValuationAPIClient');

async function testValuationAPI() {
  console.log('========================================');
  console.log('VALUATION API TEST');
  console.log('========================================\n');

  // Test VRM (must contain 'A' for test mode)
  const testVRM = 'AB12CDE';
  const testMileage = 50000;

  console.log(`Test VRM: ${testVRM}`);
  console.log(`Test Mileage: ${testMileage}`);
  console.log(`API Environment: ${process.env.API_ENVIRONMENT || 'production'}`);
  console.log(`API Key: ${process.env.VALUATION_API_LIVE_KEY ? process.env.VALUATION_API_LIVE_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`Base URL: ${process.env.VALUATION_API_BASE_URL || 'NOT SET'}`);
  console.log('========================================\n');

  try {
    // Initialize client
    const apiKey = process.env.API_ENVIRONMENT === 'production' 
      ? process.env.VALUATION_API_LIVE_KEY 
      : process.env.VALUATION_API_TEST_KEY;
    
    const baseUrl = process.env.VALUATION_API_BASE_URL;
    const isTestMode = process.env.API_ENVIRONMENT === 'test';

    if (!apiKey) {
      console.error('❌ API key not configured');
      return;
    }

    if (!baseUrl) {
      console.error('❌ Base URL not configured');
      return;
    }

    const client = new ValuationAPIClient(apiKey, baseUrl, isTestMode);

    console.log('Testing Valuation API...\n');
    
    const result = await client.getValuation(testVRM, testMileage);
    
    console.log('✅ Valuation API call successful!');
    console.log('\nValuation Result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Valuation API call failed');
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
  }
}

// Run test
testValuationAPI();
