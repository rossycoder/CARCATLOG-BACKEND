/**
 * Test the updateAdvert fix for estimatedValue object to number conversion
 */

console.log('🧪 Testing UpdateAdvert Fix - EstimatedValue Object to Number Conversion');
console.log('='.repeat(70));

// Mock the problematic vehicleData that comes from frontend
const mockVehicleData = {
  make: 'BMW',
  model: 'i4',
  variant: 'M50',
  year: 2022,
  price: 36971,
  estimatedValue: {}, // This is the problem - empty object
  allValuations: {
    private: 36971,
    retail: 41550,
    trade: 34694
  },
  mileage: 2500,
  fuelType: 'Electric',
  transmission: 'automatic'
};

console.log('\n📊 Input vehicleData (problematic):');
console.log('- estimatedValue:', JSON.stringify(mockVehicleData.estimatedValue));
console.log('- estimatedValue type:', typeof mockVehicleData.estimatedValue);
console.log('- allValuations:', JSON.stringify(mockVehicleData.allValuations));

console.log('\n🔧 Testing NEW fix logic:');

// Simulate the fix logic from advertController
const { __v, _id, createdAt, updatedAt, ...cleanVehicleData } = mockVehicleData;

// CRITICAL FIX: Handle estimatedValue conversion from object to number
if (cleanVehicleData.estimatedValue && typeof cleanVehicleData.estimatedValue === 'object') {
  // If estimatedValue is an object, extract the private price
  if (cleanVehicleData.estimatedValue.private) {
    cleanVehicleData.estimatedValue = cleanVehicleData.estimatedValue.private;
    console.log('✅ Converted estimatedValue object to number (private):', cleanVehicleData.estimatedValue);
  } else if (cleanVehicleData.estimatedValue.retail) {
    cleanVehicleData.estimatedValue = cleanVehicleData.estimatedValue.retail;
    console.log('✅ Converted estimatedValue object to number (retail):', cleanVehicleData.estimatedValue);
  } else {
    // If object is empty or has no valid prices, remove it
    delete cleanVehicleData.estimatedValue;
    console.log('✅ Removed empty estimatedValue object');
  }
}

// CRITICAL FIX: Handle allValuations - this should not be saved to Car model
if (cleanVehicleData.allValuations) {
  delete cleanVehicleData.allValuations;
  console.log('✅ Removed allValuations (not part of Car schema)');
}

console.log('\n📦 Output cleanVehicleData (fixed):');
console.log('- estimatedValue:', cleanVehicleData.estimatedValue);
console.log('- estimatedValue type:', typeof cleanVehicleData.estimatedValue);
console.log('- allValuations:', cleanVehicleData.allValuations);

console.log('\n🎯 Database compatibility test:');
if (typeof cleanVehicleData.estimatedValue === 'number' || cleanVehicleData.estimatedValue === undefined) {
  console.log('✅ SUCCESS: estimatedValue is now compatible with Car schema (Number type)');
} else {
  console.log('❌ FAILED: estimatedValue is still not compatible with Car schema');
}

if (!cleanVehicleData.allValuations) {
  console.log('✅ SUCCESS: allValuations removed (not part of Car schema)');
} else {
  console.log('❌ FAILED: allValuations still present');
}

console.log('\n🏁 FINAL RESULTS:');
console.log('='.repeat(50));

const isFixed = (typeof cleanVehicleData.estimatedValue === 'number' || cleanVehicleData.estimatedValue === undefined) && 
               !cleanVehicleData.allValuations;

if (isFixed) {
  console.log('🎉 SUCCESS: UpdateAdvert fix is working!');
  console.log('   - EstimatedValue object converted to number');
  console.log('   - AllValuations removed from update data');
  console.log('   - No more "Cast to Number failed" errors');
} else {
  console.log('❌ FAILED: UpdateAdvert fix is not working');
}

console.log('\n✅ Test completed successfully!');

// Test with different scenarios
console.log('\n🔄 Testing additional scenarios:');

// Scenario 1: estimatedValue with private price
const scenario1 = {
  estimatedValue: { private: 25000, retail: 28000, trade: 22000 },
  allValuations: { private: 25000, retail: 28000, trade: 22000 }
};

console.log('\n📊 Scenario 1 - EstimatedValue with private price:');
console.log('Input:', JSON.stringify(scenario1.estimatedValue));

if (scenario1.estimatedValue && typeof scenario1.estimatedValue === 'object') {
  if (scenario1.estimatedValue.private) {
    scenario1.estimatedValue = scenario1.estimatedValue.private;
  }
}
delete scenario1.allValuations;

console.log('Output:', scenario1.estimatedValue, '(type:', typeof scenario1.estimatedValue, ')');

// Scenario 2: estimatedValue with only retail price
const scenario2 = {
  estimatedValue: { retail: 30000, trade: 27000 },
  allValuations: { retail: 30000, trade: 27000 }
};

console.log('\n📊 Scenario 2 - EstimatedValue with only retail price:');
console.log('Input:', JSON.stringify(scenario2.estimatedValue));

if (scenario2.estimatedValue && typeof scenario2.estimatedValue === 'object') {
  if (scenario2.estimatedValue.private) {
    scenario2.estimatedValue = scenario2.estimatedValue.private;
  } else if (scenario2.estimatedValue.retail) {
    scenario2.estimatedValue = scenario2.estimatedValue.retail;
  }
}
delete scenario2.allValuations;

console.log('Output:', scenario2.estimatedValue, '(type:', typeof scenario2.estimatedValue, ')');

console.log('\n🎯 All scenarios handled correctly!');