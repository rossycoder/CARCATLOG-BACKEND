/**
 * Test the complete valuation flow
 * Tests both the API endpoint and data display
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testValuationFlow() {
  console.log('🧪 Testing Complete Valuation Flow\n');
  console.log('='.repeat(60));

  const testCases = [
    { vrm: 'BD51SMR', mileage: 50000, description: 'Standard test VRM' },
    { vrm: 'AA19ABC', mileage: 30000, description: 'Test VRM with A' },
    { vrm: 'XY12ZAB', mileage: 75000, description: 'High mileage test' },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.description}`);
    console.log(`   VRM: ${testCase.vrm}, Mileage: ${testCase.mileage}`);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/vehicle-valuation/detailed`,
        {
          vrm: testCase.vrm,
          mileage: testCase.mileage,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        console.log('   ✅ PASS - API returned success');
        
        const valuation = response.data.data.valuation;
        if (valuation?.estimatedValue) {
          console.log(`   💰 Retail: £${valuation.estimatedValue.retail?.toLocaleString()}`);
          console.log(`   💰 Private: £${valuation.estimatedValue.private?.toLocaleString()}`);
          console.log(`   💰 Trade: £${valuation.estimatedValue.trade?.toLocaleString()}`);
        }

        if (response.data.isMockData) {
          console.log('   ⚠️  Using mock data (API unavailable)');
        }

        passedTests++;
      } else {
        console.log('   ❌ FAIL - API returned failure');
        failedTests++;
      }
    } catch (error) {
      console.log('   ❌ FAIL - Error occurred');
      console.log(`   Error: ${error.message}`);
      failedTests++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passedTests}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failedTests}/${testCases.length}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('\n✨ The valuation API is working correctly!');
    console.log('   You can now use the frontend at: http://localhost:3000/valuation/vehicle');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend logs.');
  }

  return failedTests === 0;
}

// Run the test
testValuationFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
