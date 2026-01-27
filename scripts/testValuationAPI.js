/**
 * Test Valuation API Response
 * Check what the API is actually returning for valuations
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testValuationAPI(vrm, mileage) {
  const apiKey = process.env.CHECKCARD_API_KEY;
  const baseUrl = process.env.CHECKCARD_API_BASE_URL;
  
  console.log(`\n🔍 Testing Valuation API for ${vrm} with ${mileage} miles`);
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`Base URL: ${baseUrl}`);
  
  try {
    const url = `${baseUrl}/vehicledata/vehiclevaluation`;
    console.log(`\nCalling: ${url}`);
    console.log(`Params: apikey=${apiKey?.substring(0, 10)}..., vrm=${vrm}, mileage=${mileage}`);
    
    const response = await axios.get(url, {
      params: {
        apikey: apiKey,
        vrm: vrm.toUpperCase(),
        mileage: mileage
      },
      timeout: 10000
    });
    
    console.log(`\n✅ API Response Status: ${response.status}`);
    console.log(`\n📊 RAW API RESPONSE:`);
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check for valuation values
    if (response.data.ValuationList) {
      console.log(`\n💰 VALUATION VALUES:`);
      console.log(`  Dealer Forecourt: £${response.data.ValuationList.DealerForecourt || 0}`);
      console.log(`  Trade Average: £${response.data.ValuationList.TradeAverage || 0}`);
      console.log(`  Part Exchange: £${response.data.ValuationList.PartExchange || 0}`);
      console.log(`  Private Clean: £${response.data.ValuationList.PrivateClean || 0}`);
    }
    
    if (response.data.estimatedValue) {
      console.log(`\n💰 ESTIMATED VALUE:`);
      console.log(`  Retail: £${response.data.estimatedValue.retail || 0}`);
      console.log(`  Trade: £${response.data.estimatedValue.trade || 0}`);
      console.log(`  Private: £${response.data.estimatedValue.private || 0}`);
    }
    
  } catch (error) {
    console.error(`\n❌ API Error:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
  }
}

// Test with a few different vehicles
async function runTests() {
  // Test 1: Honda Civic from the screenshot
  await testValuationAPI('R008PFA', 175000);
  
  // Test 2: Another vehicle
  await testValuationAPI('MX08XMT', 100000);
  
  // Test 3: Low mileage
  await testValuationAPI('R008PFA', 50000);
}

runTests().then(() => {
  console.log('\n✅ Tests complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
