/**
 * Test automatic variant generation when adding new car
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const vehicleFormatter = require('../utils/vehicleFormatter');

// Test data simulating DVLA response
const testVehicles = [
  {
    make: 'HONDA',
    model: 'Civic',
    engineSize: 2.2,
    engineSizeLitres: 2.2,
    fuelType: 'Diesel',
    transmission: 'manual',
    doors: 5
  },
  {
    make: 'BMW',
    model: '3 Series',
    engineSize: 2.0,
    engineSizeLitres: 2.0,
    fuelType: 'Diesel',
    transmission: 'automatic',
    doors: 4
  },
  {
    make: 'SKODA',
    model: 'Octavia',
    engineSize: 1.6,
    engineSizeLitres: 1.6,
    fuelType: 'Diesel',
    transmission: 'manual',
    modelVariant: 'S TDI CR',
    doors: 5
  }
];

console.log('Testing Automatic Variant Generation\n');
console.log('=====================================\n');

testVehicles.forEach((vehicle, index) => {
  console.log(`Test ${index + 1}: ${vehicle.make} ${vehicle.model}`);
  console.log('Input Data:');
  console.log(`  Engine Size: ${vehicle.engineSize}L`);
  console.log(`  Fuel Type: ${vehicle.fuelType}`);
  console.log(`  Transmission: ${vehicle.transmission}`);
  console.log(`  Doors: ${vehicle.doors}`);
  if (vehicle.modelVariant) {
    console.log(`  Model Variant: ${vehicle.modelVariant}`);
  }
  
  const generatedVariant = vehicleFormatter.formatVariant(vehicle);
  
  console.log('\nGenerated Variant:');
  if (generatedVariant) {
    console.log(`  ✅ "${generatedVariant}"`);
  } else {
    console.log(`  ❌ No variant generated`);
  }
  console.log('\n---\n');
});

console.log('Test Complete!');
console.log('\nExpected Results:');
console.log('1. Honda Civic: "2.2 TDI 5dr" (or similar)');
console.log('2. BMW 3 Series: "2.0 d 4dr" (or similar)');
console.log('3. Skoda Octavia: "1.6 TDI S 5dr" (extracted trim from modelVariant)');
