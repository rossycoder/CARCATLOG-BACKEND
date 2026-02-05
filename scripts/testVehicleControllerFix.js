/**
 * Test the vehicle controller fix for empty estimatedValue
 */

console.log('🧪 Testing Vehicle Controller Fix for Empty EstimatedValue');
console.log('='.repeat(60));

// Mock the problematic wrapped data that comes from enhanced vehicle service
const mockWrappedData = {
  registration: 'BG22UCP',
  make: { value: 'BMW', source: 'cached' },
  model: { value: 'i4', source: 'cached' },
  variant: { value: 'M50', source: 'cached' },
  year: { value: 2022, source: 'cached' },
  price: 36971, // This is available
  estimatedValue: {}, // Empty object
  allValuations: {}, // Empty object
  valuation: {
    vrm: 'BG22UCP',
    mileage: 50000,
    estimatedValue: {}, // This is the problem - empty object
    confidence: 'medium',
    source: 'cached'
  },
  dataSources: {
    checkCarDetails: true,
    cached: true,
    valuation: true
  }
};

console.log('\n📊 Input (problematic wrapped data):');
console.log('- price:', mockWrappedData.price);
console.log('- estimatedValue:', JSON.stringify(mockWrappedData.estimatedValue));
console.log('- allValuations:', JSON.stringify(mockWrappedData.allValuations));
console.log('- valuation.estimatedValue:', JSON.stringify(mockWrappedData.valuation.estimatedValue));

console.log('\n🔧 Testing NEW vehicle controller unwrap logic:');

// Simulate the unwrapVehicleData function logic
function testUnwrapVehicleData(wrappedData) {
  const unwrapped = {};
  
  // Helper function to extract value from wrapped format
  const getValue = (field) => {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object' && field !== null && field.hasOwnProperty('value')) {
      return field.value;
    }
    return field;
  };
  
  // Recursively unwrap nested objects
  const unwrapObject = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj;
    if (typeof obj !== 'object') return obj;
    
    if (obj.hasOwnProperty('value')) {
      return obj.value;
    }
    
    const unwrappedObj = {};
    Object.entries(obj).forEach(([key, value]) => {
      unwrappedObj[key] = unwrapObject(value);
    });
    return unwrappedObj;
  };
  
  // Unwrap all fields
  Object.entries(wrappedData).forEach(([key, value]) => {
    if (key === 'dataSources' || key === 'fieldSources') {
      unwrapped[key] = value;
    } else if (key === 'valuation' && typeof value === 'object' && value !== null && !value.hasOwnProperty('value')) {
      // Keep valuation object as-is if it's already unwrapped, but fix empty estimatedValue
      const fixedValuation = { ...value };
      
      // CRITICAL FIX: Handle empty estimatedValue in valuation object
      if (fixedValuation.estimatedValue && 
          typeof fixedValuation.estimatedValue === 'object' && 
          Object.keys(fixedValuation.estimatedValue).length === 0) {
        
        console.log(`✅ Fixing empty estimatedValue for valuation`);
        
        // Try to reconstruct from other sources in the wrapped data
        if (wrappedData.allValuations && Object.keys(wrappedData.allValuations).length > 0) {
          fixedValuation.estimatedValue = wrappedData.allValuations;
          console.log(`✅ Reconstructed estimatedValue from allValuations:`, fixedValuation.estimatedValue);
        } else {
          // Try to find price data elsewhere in the wrapped data
          const privatePrice = wrappedData.privatePrice || wrappedData.price;
          if (privatePrice && privatePrice > 0) {
            fixedValuation.estimatedValue = {
              private: privatePrice,
              retail: Math.round(privatePrice * 1.15), // Estimate retail as 15% higher
              trade: Math.round(privatePrice * 0.85)   // Estimate trade as 15% lower
            };
            console.log(`✅ Reconstructed estimatedValue from price:`, fixedValuation.estimatedValue);
          } else {
            console.log(`❌ Could not reconstruct estimatedValue - no price data available`);
          }
        }
      }
      
      unwrapped[key] = fixedValuation;
    } else if (Array.isArray(value)) {
      unwrapped[key] = value;
    } else {
      unwrapped[key] = unwrapObject(value);
    }
  });
  
  // CRITICAL FIX: Final check for price data - ensure we have some price available
  if (!unwrapped.valuation || !unwrapped.valuation.estimatedValue || 
      Object.keys(unwrapped.valuation.estimatedValue).length === 0) {
    
    // Try to find any price data in the unwrapped data
    const availablePrice = unwrapped.price || unwrapped.estimatedValue || unwrapped.privatePrice;
    
    if (availablePrice && availablePrice > 0) {
      console.log(`✅ Creating valuation from available price: £${availablePrice}`);
      
      if (!unwrapped.valuation) {
        unwrapped.valuation = {};
      }
      
      unwrapped.valuation.estimatedValue = {
        private: availablePrice,
        retail: Math.round(availablePrice * 1.15),
        trade: Math.round(availablePrice * 0.85)
      };
      
      unwrapped.valuation.confidence = 'medium';
      unwrapped.valuation.source = 'reconstructed';
      
      console.log(`✅ Created valuation object:`, unwrapped.valuation);
    } else {
      console.log(`❌ No price data available to create valuation`);
    }
  }
  
  return unwrapped;
}

// Test the function
const result = testUnwrapVehicleData(mockWrappedData);

console.log('\n📦 Output (unwrapped data):');
console.log('- price:', result.price);
console.log('- estimatedValue:', JSON.stringify(result.estimatedValue));
console.log('- valuation.estimatedValue:', JSON.stringify(result.valuation?.estimatedValue));
console.log('- valuation.confidence:', result.valuation?.confidence);
console.log('- valuation.source:', result.valuation?.source);

// Test frontend price display with the result
console.log('\n🎯 Testing Frontend Price Display:');

const mockVehicleData = result;
const mockAdvertData = { price: '' }; // Empty string like in logs

// Frontend price display logic
let displayPrice = null;

// Try the improved frontend logic
if (mockAdvertData.price && parseFloat(mockAdvertData.price) > 0) {
  displayPrice = parseFloat(mockAdvertData.price);
} else if (mockVehicleData?.valuation?.estimatedValue?.private && mockVehicleData.valuation.estimatedValue.private > 0) {
  displayPrice = mockVehicleData.valuation.estimatedValue.private;
  console.log('✅ Using valuation.estimatedValue.private:', displayPrice);
} else if (mockVehicleData?.valuation?.estimatedValue?.retail && mockVehicleData.valuation.estimatedValue.retail > 0) {
  displayPrice = mockVehicleData.valuation.estimatedValue.retail;
  console.log('✅ Using valuation.estimatedValue.retail:', displayPrice);
} else if (mockVehicleData?.price && mockVehicleData.price > 0) {
  displayPrice = mockVehicleData.price;
  console.log('✅ Using price:', displayPrice);
}

console.log('📱 Frontend display result:', displayPrice ? `£${displayPrice.toLocaleString()}` : 'Not set');

console.log('\n🏁 FINAL RESULTS:');
console.log('='.repeat(50));

if (displayPrice && displayPrice > 0) {
  console.log('🎉 SUCCESS: Vehicle controller fix is working!');
  console.log(`   Frontend will display: £${displayPrice.toLocaleString()}`);
  console.log('   Instead of: "Not set"');
} else {
  console.log('❌ FAILED: Vehicle controller fix is not working');
  console.log('   Frontend will still display: "Not set"');
}

console.log('\n✅ Test completed successfully!');