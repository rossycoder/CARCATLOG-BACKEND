/**
 * Test script to verify null variant handling
 * Tests that "null" string values are properly filtered out
 */

// Simulate the formatter functions
const formatEngineSize = (engineSize) => {
  if (!engineSize || engineSize === 0) return '';
  const size = parseFloat(engineSize);
  if (isNaN(size)) return '';
  return `${size.toFixed(1)}L`;
};

const generateVariantDisplay = (vehicle) => {
  // If we have a variant field, use it (but check it's not "null" string or empty)
  if (vehicle.variant && vehicle.variant !== 'null' && vehicle.variant !== 'undefined' && vehicle.variant.trim() !== '') {
    return vehicle.variant;
  }
  
  // Otherwise build from available data
  const parts = [];
  
  // Engine size
  if (vehicle.engineSize) {
    const formatted = formatEngineSize(vehicle.engineSize);
    if (formatted) parts.push(formatted);
  }
  
  // Submodel (if it's actually a trim, not fuel/transmission)
  if (vehicle.submodel && vehicle.submodel !== 'null' && vehicle.submodel !== 'undefined') {
    const submodel = vehicle.submodel.toLowerCase();
    const hasFuelOrTrans = /petrol|diesel|manual|automatic|auto|electric|hybrid/.test(submodel);
    if (!hasFuelOrTrans) {
      parts.push(vehicle.submodel);
    }
  }
  
  // Fuel type
  if (vehicle.fuelType) {
    parts.push(vehicle.fuelType);
  }
  
  // Transmission
  if (vehicle.transmission) {
    const trans = vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1);
    parts.push(trans);
  }
  
  return parts.join(' ');
};

console.log('Testing null variant handling...\n');

// Test Case 1: variant is string "null"
const car1 = {
  make: 'HONDA',
  model: 'Civic',
  variant: 'null',
  engineSize: 2.2,
  fuelType: 'Diesel',
  transmission: 'manual'
};
console.log('Test 1 - variant="null":');
console.log('Input:', car1);
console.log('Output:', generateVariantDisplay(car1));
console.log('Expected: "2.2L Diesel Manual"');
console.log('Pass:', generateVariantDisplay(car1) === '2.2L Diesel Manual' ? '✓' : '✗');
console.log('');

// Test Case 2: variant is actual null
const car2 = {
  make: 'HONDA',
  model: 'Civic',
  variant: null,
  engineSize: 2.2,
  fuelType: 'Diesel',
  transmission: 'manual'
};
console.log('Test 2 - variant=null:');
console.log('Input:', car2);
console.log('Output:', generateVariantDisplay(car2));
console.log('Expected: "2.2L Diesel Manual"');
console.log('Pass:', generateVariantDisplay(car2) === '2.2L Diesel Manual' ? '✓' : '✗');
console.log('');

// Test Case 3: variant is undefined
const car3 = {
  make: 'HONDA',
  model: 'Civic',
  variant: undefined,
  engineSize: 2.2,
  fuelType: 'Diesel',
  transmission: 'manual'
};
console.log('Test 3 - variant=undefined:');
console.log('Input:', car3);
console.log('Output:', generateVariantDisplay(car3));
console.log('Expected: "2.2L Diesel Manual"');
console.log('Pass:', generateVariantDisplay(car3) === '2.2L Diesel Manual' ? '✓' : '✗');
console.log('');

// Test Case 4: variant is empty string
const car4 = {
  make: 'HONDA',
  model: 'Civic',
  variant: '',
  engineSize: 2.2,
  fuelType: 'Diesel',
  transmission: 'manual'
};
console.log('Test 4 - variant="":');
console.log('Input:', car4);
console.log('Output:', generateVariantDisplay(car4));
console.log('Expected: "2.2L Diesel Manual"');
console.log('Pass:', generateVariantDisplay(car4) === '2.2L Diesel Manual' ? '✓' : '✗');
console.log('');

// Test Case 5: variant is valid
const car5 = {
  make: 'HONDA',
  model: 'Civic',
  variant: 'Type R',
  engineSize: 2.0,
  fuelType: 'Petrol',
  transmission: 'manual'
};
console.log('Test 5 - variant="Type R":');
console.log('Input:', car5);
console.log('Output:', generateVariantDisplay(car5));
console.log('Expected: "Type R"');
console.log('Pass:', generateVariantDisplay(car5) === 'Type R' ? '✓' : '✗');
console.log('');

// Test Case 6: variant is whitespace
const car6 = {
  make: 'HONDA',
  model: 'Civic',
  variant: '   ',
  engineSize: 2.2,
  fuelType: 'Diesel',
  transmission: 'manual'
};
console.log('Test 6 - variant="   " (whitespace):');
console.log('Input:', car6);
console.log('Output:', generateVariantDisplay(car6));
console.log('Expected: "2.2L Diesel Manual"');
console.log('Pass:', generateVariantDisplay(car6) === '2.2L Diesel Manual' ? '✓' : '✗');
console.log('');

console.log('All tests completed!');
