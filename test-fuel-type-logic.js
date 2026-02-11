require('dotenv').config();

/**
 * Test the fuel type normalization logic
 */
function normalizeFuelType(apiFuelType, dvlaFuelType = null) {
  if (!apiFuelType) return null;
  
  const apiNormalized = apiFuelType.toLowerCase().trim();
  const dvlaNormalized = dvlaFuelType ? dvlaFuelType.toLowerCase().trim() : '';
  
  // SPECIAL CASE: If API says "Diesel" but DVLA says "HYBRID ELECTRIC"
  // This indicates a Diesel Hybrid (MHEV) that API didn't detect
  if (apiNormalized === 'diesel' && dvlaNormalized.includes('hybrid')) {
    return 'Diesel Hybrid';
  }
  
  // SPECIAL CASE: If API says "Petrol" but DVLA says "HYBRID ELECTRIC"
  // This indicates a Petrol Hybrid that API didn't detect
  if (apiNormalized === 'petrol' && dvlaNormalized.includes('hybrid')) {
    return 'Petrol Hybrid';
  }
  
  // Check for plug-in hybrids first
  if (apiNormalized.includes('plug-in') && (apiNormalized.includes('hybrid') || apiNormalized.includes('/'))) {
    if (apiNormalized.includes('petrol')) {
      return 'Petrol Plug-in Hybrid';
    }
    if (apiNormalized.includes('diesel')) {
      return 'Diesel Plug-in Hybrid';
    }
    return 'Plug-in Hybrid';
  }
  
  // Check for regular hybrids (including "Petrol/Electric" format)
  if (apiNormalized.includes('hybrid') || apiNormalized.includes('/')) {
    // "Petrol/Electric" or "Petrol Hybrid Electric"
    if (apiNormalized.includes('petrol') || apiNormalized.includes('gasoline')) {
      return 'Petrol Hybrid';
    }
    // "Diesel/Electric" or "Diesel Hybrid"
    if (apiNormalized.includes('diesel')) {
      return 'Diesel Hybrid';
    }
    // Generic hybrid (when subtype not specified)
    return 'Hybrid';
  }
  
  // Pure fuel types (only if no hybrid indicators)
  if (apiNormalized.includes('petrol') || apiNormalized.includes('gasoline')) {
    return 'Petrol';
  }
  if (apiNormalized.includes('diesel')) {
    return 'Diesel';
  }
  if (apiNormalized.includes('electric') || apiNormalized.includes('ev')) {
    return 'Electric';
  }
  
  // Return capitalized version if no match
  return apiFuelType.charAt(0).toUpperCase() + apiFuelType.slice(1).toLowerCase();
}

console.log('🧪 Testing Fuel Type Normalization Logic\n');
console.log('='.repeat(70));

// Test cases
const testCases = [
  {
    name: 'MA21YOX (Kia XCeed MHEV)',
    api: 'Diesel',
    dvla: 'HYBRID ELECTRIC',
    expected: 'Diesel Hybrid'
  },
  {
    name: 'Regular Diesel (no hybrid)',
    api: 'Diesel',
    dvla: 'DIESEL',
    expected: 'Diesel'
  },
  {
    name: 'Regular Petrol (no hybrid)',
    api: 'Petrol',
    dvla: 'PETROL',
    expected: 'Petrol'
  },
  {
    name: 'Petrol Hybrid (API detects)',
    api: 'Petrol Hybrid',
    dvla: 'HYBRID ELECTRIC',
    expected: 'Petrol Hybrid'
  },
  {
    name: 'Diesel Hybrid (API detects)',
    api: 'Diesel Hybrid',
    dvla: 'HYBRID ELECTRIC',
    expected: 'Diesel Hybrid'
  },
  {
    name: 'Petrol MHEV (API misses)',
    api: 'Petrol',
    dvla: 'HYBRID ELECTRIC',
    expected: 'Petrol Hybrid'
  },
  {
    name: 'Plug-in Hybrid Petrol',
    api: 'Petrol Plug-in Hybrid',
    dvla: 'HYBRID ELECTRIC',
    expected: 'Petrol Plug-in Hybrid'
  },
  {
    name: 'Electric Vehicle',
    api: 'Electric',
    dvla: 'ELECTRIC',
    expected: 'Electric'
  },
  {
    name: 'Petrol/Electric format',
    api: 'Petrol/Electric',
    dvla: 'HYBRID ELECTRIC',
    expected: 'Petrol Hybrid'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = normalizeFuelType(test.api, test.dvla);
  const isPass = result === test.expected;
  
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log(`  API Fuel Type: "${test.api}"`);
  console.log(`  DVLA Fuel Type: "${test.dvla}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Got: "${result}"`);
  console.log(`  Status: ${isPass ? '✅ PASS' : '❌ FAIL'}`);
  
  if (isPass) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('✅ All tests passed!');
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
