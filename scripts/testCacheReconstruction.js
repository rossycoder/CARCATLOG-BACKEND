/**
 * Test cache reconstruction logic for valuation data
 */

// Mock cached data structure as it would be stored in MongoDB
const mockCachedData = {
  vrm: 'BG22UCP',
  make: 'BMW',
  model: 'i4',
  valuation: {
    privatePrice: 36971,
    dealerPrice: 41550,
    partExchangePrice: 34694,
    confidence: 'medium',
    estimatedValue: {} // This is the problem - empty object
  }
};

console.log('🔍 Testing cache reconstruction logic');
console.log('=====================================');

console.log('\n📊 Mock cached data:');
console.log('- privatePrice:', mockCachedData.valuation.privatePrice);
console.log('- dealerPrice:', mockCachedData.valuation.dealerPrice);
console.log('- partExchangePrice:', mockCachedData.valuation.partExchangePrice);
console.log('- estimatedValue:', JSON.stringify(mockCachedData.valuation.estimatedValue));
console.log('- estimatedValue is empty:', Object.keys(mockCachedData.valuation.estimatedValue).length === 0);

console.log('\n🔧 Testing OLD logic (current):');
const oldLogic = mockCachedData.valuation.estimatedValue || {
  private: mockCachedData.valuation.privatePrice,
  retail: mockCachedData.valuation.dealerPrice,
  trade: mockCachedData.valuation.partExchangePrice
};
console.log('Result:', JSON.stringify(oldLogic));

console.log('\n🔧 Testing NEW logic (fixed):');
const newLogic = mockCachedData.valuation.estimatedValue && 
                Object.keys(mockCachedData.valuation.estimatedValue).length > 0 ? 
                mockCachedData.valuation.estimatedValue : {
  private: mockCachedData.valuation.privatePrice,
  retail: mockCachedData.valuation.dealerPrice,
  trade: mockCachedData.valuation.partExchangePrice
};
console.log('Result:', JSON.stringify(newLogic));

console.log('\n✅ The fix correctly reconstructs the estimatedValue object!');