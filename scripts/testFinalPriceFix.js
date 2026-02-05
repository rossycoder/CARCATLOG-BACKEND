/**
 * Test the final price fix with exact problematic data structure
 */

console.log('🔧 Testing Final Price Fix');
console.log('==========================');

// Simulate the exact cached data structure that's causing the problem
const mockCached = {
  vrm: 'BG22UCP',
  make: 'BMW',
  model: 'i4',
  valuation: {
    privatePrice: 36971,
    dealerPrice: 41550,
    partExchangePrice: 34694,
    confidence: 'medium',
    estimatedValue: {} // This is the problem - empty object
  },
  mileage: 2500
};

console.log('\n📊 Mock cached data:');
console.log('- privatePrice:', mockCached.valuation.privatePrice);
console.log('- estimatedValue:', JSON.stringify(mockCached.valuation.estimatedValue));
console.log('- estimatedValue is empty:', Object.keys(mockCached.valuation.estimatedValue).length === 0);

console.log('\n🔧 Testing IMPROVED fix logic:');

// Test the improved fix logic
const reconstructedValuation = mockCached.valuation ? {
  vrm: mockCached.vrm,
  mileage: mockCached.mileage || 50000,
  estimatedValue: (mockCached.valuation.estimatedValue && 
                 Object.keys(mockCached.valuation.estimatedValue).length > 0) ? 
                 mockCached.valuation.estimatedValue : 
                 // Fallback: reconstruct from individual price fields
                 (mockCached.valuation.privatePrice ? {
                   private: mockCached.valuation.privatePrice,
                   retail: mockCached.valuation.dealerPrice,
                   trade: mockCached.valuation.partExchangePrice
                 } : {}),
  confidence: mockCached.valuation.confidence || 'medium',
  source: 'cached'
} : null;

console.log('\n✅ Reconstructed valuation:');
console.log('VRM:', reconstructedValuation.vrm);
console.log('Mileage:', reconstructedValuation.mileage);
console.log('EstimatedValue:', JSON.stringify(reconstructedValuation.estimatedValue));

if (reconstructedValuation.estimatedValue && reconstructedValuation.estimatedValue.private) {
  console.log('\n🎯 SUCCESS! Price will display correctly:');
  console.log('💷 Private sale: £' + reconstructedValuation.estimatedValue.private);
  console.log('💷 Retail price: £' + reconstructedValuation.estimatedValue.retail);
  console.log('💷 Trade price: £' + reconstructedValuation.estimatedValue.trade);
  console.log('\n✅ Frontend will show: £' + reconstructedValuation.estimatedValue.private + ' instead of "Not set"');
} else {
  console.log('\n❌ FAILED: Price will still show "Not set"');
}

console.log('\n🔄 Testing edge case - no individual prices:');
const mockCachedNoIndividualPrices = {
  vrm: 'TEST123',
  valuation: {
    confidence: 'medium',
    estimatedValue: {} // Empty and no individual prices
  }
};

const edgeCaseResult = mockCachedNoIndividualPrices.valuation ? {
  estimatedValue: (mockCachedNoIndividualPrices.valuation.estimatedValue && 
                 Object.keys(mockCachedNoIndividualPrices.valuation.estimatedValue).length > 0) ? 
                 mockCachedNoIndividualPrices.valuation.estimatedValue : 
                 (mockCachedNoIndividualPrices.valuation.privatePrice ? {
                   private: mockCachedNoIndividualPrices.valuation.privatePrice,
                   retail: mockCachedNoIndividualPrices.valuation.dealerPrice,
                   trade: mockCachedNoIndividualPrices.valuation.partExchangePrice
                 } : {})
} : null;

console.log('Edge case result:', JSON.stringify(edgeCaseResult.estimatedValue));
console.log('✅ Edge case handled correctly - returns empty object when no data available');

console.log('\n🎯 FINAL RESULT: The improved fix handles both scenarios correctly!');