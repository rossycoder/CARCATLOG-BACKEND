const mongoose = require('mongoose');
require('dotenv').config();

// Test the frontend price range calculation logic
function calculatePriceRange(valuation, isTradeType) {
  if (!valuation || isNaN(valuation)) return null;
  
  const value = parseFloat(valuation);
  
  if (isTradeType) {
    // Trade pricing tiers
    if (value < 1000) return 'under-1000';
    if (value <= 2000) return '1001-2000';
    if (value <= 3000) return '2001-3000';
    if (value <= 5000) return '3001-5000';
    if (value <= 7000) return '5001-7000';
    if (value <= 10000) return '7001-10000';
    if (value <= 17000) return '10001-17000';
    return 'over-17000';
  } else {
    // Private pricing tiers
    if (value < 1000) return 'under-1000';
    if (value <= 2999) return '1000-2999';
    if (value <= 4999) return '3000-4999';
    if (value <= 6999) return '5000-6999';
    if (value <= 9999) return '7000-9999';
    if (value <= 12999) return '10000-12999';
    if (value <= 16999) return '13000-16999';
    if (value <= 24999) return '17000-24999';
    return 'over-24995';
  }
}

async function testFrontendPriceRangeLogic() {
  console.log('🧪 Testing Frontend Price Range Auto-Selection Logic');
  console.log('=' .repeat(60));
  
  // Test cases
  const testCases = [
    { valuation: 36971, sellerType: 'private', expected: 'over-24995' },
    { valuation: 36971, sellerType: 'trade', expected: 'over-17000' },
    { valuation: 15000, sellerType: 'private', expected: '13000-16999' },
    { valuation: 15000, sellerType: 'trade', expected: '10001-17000' },
    { valuation: 500, sellerType: 'private', expected: 'under-1000' },
    { valuation: 500, sellerType: 'trade', expected: 'under-1000' },
    { valuation: 25000, sellerType: 'private', expected: 'over-24995' },
    { valuation: 25000, sellerType: 'trade', expected: 'over-17000' }
  ];
  
  console.log('Testing price range calculation logic:');
  console.log('');
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const result = calculatePriceRange(testCase.valuation, testCase.sellerType === 'trade');
    const passed = result === testCase.expected;
    allPassed = allPassed && passed;
    
    console.log(`${passed ? '✅' : '❌'} Valuation: £${testCase.valuation.toLocaleString()}, Seller: ${testCase.sellerType}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    console.log('');
  }
  
  console.log('=' .repeat(60));
  console.log(`Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  // Test the specific case from the error logs
  console.log('');
  console.log('🔍 Testing the specific error case:');
  console.log('Valuation: £36,971, Seller Type: private');
  
  const specificResult = calculatePriceRange(36971, false);
  console.log(`Expected: over-24995, Got: ${specificResult}`);
  console.log(`Result: ${specificResult === 'over-24995' ? '✅ CORRECT' : '❌ INCORRECT'}`);
  
  // Test data extraction priority
  console.log('');
  console.log('🔍 Testing data extraction priority:');
  
  const mockVehicleData = {
    price: 36971,  // This should be prioritized
    allValuations: {
      private: 35000  // This should be secondary
    },
    estimatedValue: {}  // This is empty object (the problem case)
  };
  
  // Simulate the extraction logic
  let extractedValue = null;
  if (mockVehicleData?.price && typeof mockVehicleData.price === 'number') {
    extractedValue = mockVehicleData.price;
    console.log('✅ Correctly extracted vehicleData.price:', extractedValue);
  } else if (mockVehicleData?.allValuations?.private && typeof mockVehicleData.allValuations.private === 'number') {
    extractedValue = mockVehicleData.allValuations.private;
    console.log('✅ Fallback to vehicleData.allValuations.private:', extractedValue);
  }
  
  const extractedRange = calculatePriceRange(extractedValue, false);
  console.log(`Extracted value: £${extractedValue?.toLocaleString()}`);
  console.log(`Calculated range: ${extractedRange}`);
  console.log(`Should match backend expectation: ${extractedRange === 'over-24995' ? '✅ YES' : '❌ NO'}`);
}

// Run the test
testFrontendPriceRangeLogic()
  .then(() => {
    console.log('');
    console.log('🎯 Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });