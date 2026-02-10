/**
 * Test script to verify price range calculation logic
 * Tests the scenario where privatePrice is £4,927
 */

// Price range calculation function (copied from CarAdvertisingPricesPage.jsx)
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

// Test cases
console.log('🧪 Testing Price Range Calculation\n');

// Test case 1: £4,927 (user's reported issue)
const testValue1 = 4927;
const result1 = calculatePriceRange(testValue1, false);
console.log(`Test 1: £${testValue1} (Private Seller)`);
console.log(`  Expected: 3000-4999`);
console.log(`  Got: ${result1}`);
console.log(`  ✅ ${result1 === '3000-4999' ? 'PASS' : '❌ FAIL'}\n`);

// Test case 2: Edge cases
const testCases = [
  { value: 999, expected: 'under-1000', seller: 'private' },
  { value: 1000, expected: '1000-2999', seller: 'private' },
  { value: 2999, expected: '1000-2999', seller: 'private' },
  { value: 3000, expected: '3000-4999', seller: 'private' },
  { value: 4999, expected: '3000-4999', seller: 'private' },
  { value: 5000, expected: '5000-6999', seller: 'private' },
  { value: 6999, expected: '5000-6999', seller: 'private' },
  { value: 7000, expected: '7000-9999', seller: 'private' },
];

console.log('Edge Case Tests:');
testCases.forEach((test, index) => {
  const result = calculatePriceRange(test.value, test.seller === 'trade');
  const pass = result === test.expected;
  console.log(`  ${index + 1}. £${test.value} → ${result} ${pass ? '✅' : '❌ (expected: ' + test.expected + ')'}`);
});

console.log('\n🔍 Data Structure Test\n');

// Simulate the data structure from the user's car
const mockVehicleData = {
  price: 4927, // User-entered price
  valuation: {
    privatePrice: 4927, // Actual valuation
    dealerPrice: 5500,
    partExchangePrice: 4200
  },
  estimatedValue: 4927
};

// Test extraction logic (from CarAdvertisingPricesPage.jsx)
let valuation = null;

if (mockVehicleData?.valuation?.privatePrice && typeof mockVehicleData.valuation.privatePrice === 'number') {
  valuation = mockVehicleData.valuation.privatePrice;
  console.log('✅ Using vehicleData.valuation.privatePrice:', valuation);
} else if (mockVehicleData?.estimatedValue && typeof mockVehicleData.estimatedValue === 'number') {
  valuation = mockVehicleData.estimatedValue;
  console.log('✅ Using vehicleData.estimatedValue:', valuation);
} else if (mockVehicleData?.price && typeof mockVehicleData.price === 'number') {
  valuation = mockVehicleData.price;
  console.log('⚠️  Using vehicleData.price (user-entered, not valuation):', valuation);
}

const calculatedRange = calculatePriceRange(valuation, false);
console.log(`\nCalculated Price Range: ${calculatedRange}`);
console.log(`Expected: 3000-4999`);
console.log(`Result: ${calculatedRange === '3000-4999' ? '✅ PASS' : '❌ FAIL'}`);
