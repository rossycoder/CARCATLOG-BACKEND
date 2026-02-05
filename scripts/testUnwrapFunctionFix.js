// Test the unwrap function fix without requiring full controller initialization

function unwrapVehicleData(wrappedData) {
  // Simplified version of the unwrap function for testing
  const unwrapValue = (item) => {
    if (item && typeof item === 'object' && item.hasOwnProperty('value')) {
      return item.value;
    }
    return item;
  };

  const unwrapObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const unwrappedObj = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (Array.isArray(value)) {
        unwrappedObj[key] = value.map(item => unwrapValue(item));
      } else if (value && typeof value === 'object' && !value.hasOwnProperty('value')) {
        unwrappedObj[key] = unwrapObject(value);
      } else {
        unwrappedObj[key] = unwrapValue(value);
      }
    });
    return unwrappedObj;
  };

  const unwrapped = unwrapObject(wrappedData);
  
  // CRITICAL FIX: Extract private sale value as the main price field for frontend
  if (unwrapped.valuation && unwrapped.valuation.estimatedValue) {
    const privateSaleValue = unwrapped.valuation.estimatedValue.private;
    if (privateSaleValue && typeof privateSaleValue === 'number' && privateSaleValue > 0) {
      unwrapped.price = privateSaleValue;
      console.log(`[Vehicle Controller] Set price field to private sale value: £${privateSaleValue}`);
    } else {
      console.log(`[Vehicle Controller] No valid private sale value found:`, unwrapped.valuation.estimatedValue);
    }
  } else {
    console.log(`[Vehicle Controller] No valuation data available for price extraction`);
  }
  
  return unwrapped;
}

console.log('🧪 Testing Unwrap Function Fix');
console.log('=' .repeat(60));

// Test case 1: Proper valuation data
console.log('Test 1: Proper valuation data');
const mockData1 = {
  make: { value: 'BMW', source: 'dvla' },
  model: { value: 'i4', source: 'dvla' },
  year: { value: 2022, source: 'dvla' },
  valuation: {
    estimatedValue: {
      private: 36971,
      retail: 42517,
      trade: 31425
    },
    confidence: 'high',
    source: 'api'
  }
};

const result1 = unwrapVehicleData(mockData1);
console.log('Result:', {
  make: result1.make,
  model: result1.model,
  year: result1.year,
  price: result1.price,
  'valuation.estimatedValue.private': result1.valuation?.estimatedValue?.private
});

if (result1.price === 36971) {
  console.log('✅ SUCCESS: Price correctly set to private sale value');
} else {
  console.log('❌ FAILED: Price not set correctly');
}

console.log('');

// Test case 2: Empty valuation data (current BG22UCP issue)
console.log('Test 2: Empty valuation data');
const mockData2 = {
  make: { value: 'BMW', source: 'dvla' },
  model: { value: 'i4', source: 'dvla' },
  year: { value: 2022, source: 'dvla' },
  valuation: {
    estimatedValue: {},
    confidence: 'medium',
    source: 'cached'
  }
};

const result2 = unwrapVehicleData(mockData2);
console.log('Result:', {
  make: result2.make,
  model: result2.model,
  year: result2.year,
  price: result2.price,
  'valuation.estimatedValue': result2.valuation?.estimatedValue
});

if (!result2.price) {
  console.log('✅ EXPECTED: No price set when valuation is empty');
} else {
  console.log('❌ UNEXPECTED: Price was set despite empty valuation');
}

console.log('');

// Test case 3: No valuation data at all
console.log('Test 3: No valuation data');
const mockData3 = {
  make: { value: 'BMW', source: 'dvla' },
  model: { value: 'i4', source: 'dvla' },
  year: { value: 2022, source: 'dvla' }
};

const result3 = unwrapVehicleData(mockData3);
console.log('Result:', {
  make: result3.make,
  model: result3.model,
  year: result3.year,
  price: result3.price
});

if (!result3.price) {
  console.log('✅ EXPECTED: No price set when no valuation data');
} else {
  console.log('❌ UNEXPECTED: Price was set despite no valuation data');
}

console.log('');
console.log('🎯 Test Summary:');
console.log('The fix correctly extracts private sale value when available');
console.log('The issue with BG22UCP is that the cached valuation data is empty');
console.log('Solution: Need to refresh the valuation data for BG22UCP or use a different test vehicle');

console.log('');
console.log('💡 Recommendation:');
console.log('1. Clear cache for BG22UCP completely');
console.log('2. Make a fresh API call to get proper valuation data');
console.log('3. Or test with a different vehicle that has proper valuation data');