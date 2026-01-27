/**
 * Check £1,000 Valuations
 * Test multiple vehicles to see which ones return £1,000 valuation
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testValuation(vrm, mileage) {
  const apiKey = process.env.CHECKCARD_API_KEY;
  const baseUrl = process.env.CHECKCARD_API_BASE_URL;
  
  try {
    const response = await axios.get(`${baseUrl}/vehicledata/vehiclevaluation`, {
      params: {
        apikey: apiKey,
        vrm: vrm.toUpperCase(),
        mileage: mileage
      },
      timeout: 10000
    });
    
    const data = response.data;
    const valuations = data.ValuationList || {};
    
    // Check if any valuation is exactly £1,000
    const has1000 = Object.values(valuations).some(v => parseInt(v) === 1000);
    
    console.log(`\n${vrm} (${mileage} miles):`);
    console.log(`  Dealer: £${valuations.DealerForecourt || 0}`);
    console.log(`  Trade: £${valuations.TradeAverage || 0}`);
    console.log(`  Private: £${valuations.PrivateClean || 0}`);
    
    if (has1000) {
      console.log(`  ⚠️  WARNING: Contains £1,000 valuation!`);
    }
    
    // Check if ALL valuations are £1,000
    const all1000 = Object.values(valuations).every(v => parseInt(v) === 1000);
    if (all1000) {
      console.log(`  🚨 CRITICAL: ALL valuations are £1,000 - likely API issue or very poor condition vehicle`);
    }
    
    return {
      vrm,
      mileage,
      valuations,
      has1000,
      all1000
    };
    
  } catch (error) {
    console.log(`\n${vrm}: ❌ ${error.response?.data?.message?.message || error.message}`);
    return {
      vrm,
      mileage,
      error: true
    };
  }
}

async function runTests() {
  console.log('🔍 Testing Multiple Vehicles for £1,000 Valuations\n');
  console.log('='.repeat(60));
  
  // Test various vehicles
  const tests = [
    // Known good vehicle
    { vrm: 'MX08XMT', mileage: 100000 },
    
    // Vehicle not in database
    { vrm: 'R008PFA', mileage: 175000 },
    
    // Add more test vehicles here
    // { vrm: 'YOUR_VRM', mileage: YOUR_MILEAGE },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testValuation(test.vrm, test.mileage);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:');
  
  const with1000 = results.filter(r => r.has1000 && !r.error);
  const all1000 = results.filter(r => r.all1000 && !r.error);
  const errors = results.filter(r => r.error);
  
  console.log(`  Total tested: ${results.length}`);
  console.log(`  With £1,000 valuation: ${with1000.length}`);
  console.log(`  ALL £1,000 (suspicious): ${all1000.length}`);
  console.log(`  Errors/Not found: ${errors.length}`);
  
  if (all1000.length > 0) {
    console.log('\n⚠️  VEHICLES WITH ALL £1,000 VALUATIONS:');
    all1000.forEach(r => {
      console.log(`  - ${r.vrm} (${r.mileage} miles)`);
    });
    console.log('\nThese vehicles may have:');
    console.log('  1. Very high mileage');
    console.log('  2. Poor condition');
    console.log('  3. Limited data in API');
    console.log('  4. API issue (rare)');
  }
}

// Run tests
runTests().then(() => {
  console.log('\n✅ Test complete\n');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
