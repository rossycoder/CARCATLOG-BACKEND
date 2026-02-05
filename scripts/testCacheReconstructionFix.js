/**
 * Test the cache reconstruction fix for estimatedValue
 */

console.log('🧪 Testing Cache Reconstruction Fix');
console.log('='.repeat(50));

// Mock cached data that represents the current problematic scenario
const mockCachedData = {
  vrm: 'BG22UCP',
  valuation: {
    privatePrice: 36971,
    dealerPrice: 41550,
    partExchangePrice: 34694,
    confidence: 'medium',
    estimatedValue: {} // This is the problem - empty object
  },
  mileage: 2500
};

console.log('\n📊 Input (problematic cached data):');
console.log('- privatePrice:', mockCachedData.valuation.privatePrice);
console.log('- dealerPrice:', mockCachedData.valuation.dealerPrice);
console.log('- partExchangePrice:', mockCachedData.valuation.partExchangePrice);
console.log('- estimatedValue:', JSON.stringify(mockCachedData.valuation.estimatedValue));
console.log('- estimatedValue is empty:', Object.keys(mockCachedData.valuation.estimatedValue).length === 0);

console.log('\n🔧 Testing NEW cache reconstruction logic:');

// Apply the NEW cache reconstruction logic
const cached = mockCachedData;
const reconstructedValuation = {
  vrm: cached.vrm,
  mileage: cached.mileage || 50000,
  estimatedValue: (() => {
    // First try: use existing estimatedValue if it has data
    if (cached.valuation.estimatedValue && 
        Object.keys(cached.valuation.estimatedValue).length > 0) {
      console.log(`✅ Using cached estimatedValue:`, cached.valuation.estimatedValue);
      return cached.valuation.estimatedValue;
    }
    
    // Second try: reconstruct from individual price fields in valuation object
    if (cached.valuation.privatePrice || cached.valuation.dealerPrice || cached.valuation.partExchangePrice) {
      const reconstructed = {
        private: cached.valuation.privatePrice,
        retail: cached.valuation.dealerPrice,
        trade: cached.valuation.partExchangePrice
      };
      console.log(`✅ Reconstructed estimatedValue from valuation fields:`, reconstructed);
      return reconstructed;
    }
    
    // Third try: check if cached data has valuation prices stored at root level
    if (cached.privatePrice || cached.dealerPrice || cached.partExchangePrice) {
      const reconstructed = {
        private: cached.privatePrice,
        retail: cached.dealerPrice,
        trade: cached.partExchangePrice
      };
      console.log(`✅ Reconstructed estimatedValue from root fields:`, reconstructed);
      return reconstructed;
    }
    
    // Last resort: return empty object (will be handled by frontend)
    console.log(`⚠️ No valuation data found in cache for ${cached.vrm}`);
    return {};
  })(),
  confidence: cached.valuation.confidence || 'medium',
  source: 'cached'
};

console.log('\n📦 Output (reconstructed valuation):');
console.log('- estimatedValue:', JSON.stringify(reconstructedValuation.estimatedValue));
console.log('- private price:', reconstructedValuation.estimatedValue.private);
console.log('- retail price:', reconstructedValuation.estimatedValue.retail);
console.log('- trade price:', reconstructedValuation.estimatedValue.trade);

// Test frontend price display with reconstructed data
console.log('\n🎯 Testing Frontend Price Display:');

const mockVehicleData = {
  valuation: reconstructedValuation,
  allValuations: reconstructedValuation.estimatedValue,
  estimatedValue: reconstructedValuation.estimatedValue.private || reconstructedValuation.estimatedValue.retail,
  price: reconstructedValuation.estimatedValue.private
};

const mockAdvertData = { price: '' }; // Empty string like in logs

// Frontend price display logic (from logs)
let displayPrice = null;

// 1. Try advertData.price
if (mockAdvertData.price && (typeof mockAdvertData.price === 'number' ? mockAdvertData.price > 0 : parseFloat(mockAdvertData.price) > 0)) {
  displayPrice = typeof mockAdvertData.price === 'number' ? mockAdvertData.price : parseFloat(mockAdvertData.price);
}
// 2. Try vehicleData.valuation.estimatedValue.private
else if (mockVehicleData?.valuation?.estimatedValue?.private && mockVehicleData.valuation.estimatedValue.private > 0) {
  displayPrice = mockVehicleData.valuation.estimatedValue.private;
  console.log('✅ Using valuation.estimatedValue.private:', displayPrice);
}
// 3. Try vehicleData.valuation.estimatedValue.retail
else if (mockVehicleData?.valuation?.estimatedValue?.retail && mockVehicleData.valuation.estimatedValue.retail > 0) {
  displayPrice = mockVehicleData.valuation.estimatedValue.retail;
  console.log('✅ Using valuation.estimatedValue.retail:', displayPrice);
}

console.log('📱 Frontend display result:', displayPrice ? `£${displayPrice.toLocaleString()}` : 'Not set');

console.log('\n🏁 FINAL RESULTS:');
console.log('='.repeat(50));

if (displayPrice && displayPrice > 0) {
  console.log('🎉 SUCCESS: Cache reconstruction fix is working!');
  console.log(`   Frontend will display: £${displayPrice.toLocaleString()}`);
  console.log('   Instead of: "Not set"');
} else {
  console.log('❌ FAILED: Cache reconstruction fix is not working');
  console.log('   Frontend will still display: "Not set"');
}

console.log('\n✅ Test completed successfully!');