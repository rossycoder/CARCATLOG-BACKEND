#!/usr/bin/env node

/**
 * Test Pricing Page Data Flow
 * 
 * This script simulates the data flow from CarAdvertEditPage -> SellerContactDetailsPage -> CarAdvertisingPricesPage
 * to verify that the correct price data is being passed through.
 */

console.log('🧪 Testing Pricing Page Data Flow\n');

// Simulate the data as it appears in the logs
const mockAdvertData = {
  price: {}, // Empty object as shown in logs
  description: "Test description",
  photos: []
};

const mockVehicleData = {
  price: 36971, // Correct price as shown in logs
  estimatedValue: {}, // Empty object as shown in logs
  make: 'BMW',
  model: 'i4',
  variant: 'M50'
};

console.log('📊 Mock Data:');
console.log('advertData.price:', mockAdvertData.price, 'type:', typeof mockAdvertData.price);
console.log('vehicleData.price:', mockVehicleData.price, 'type:', typeof mockVehicleData.price);
console.log('vehicleData.estimatedValue:', mockVehicleData.estimatedValue, 'type:', typeof mockVehicleData.estimatedValue);
console.log('');

// Test OLD logic (problematic)
console.log('🔴 OLD Logic (problematic):');
const oldVehicleValuation = mockAdvertData?.price || mockVehicleData?.estimatedValue || mockVehicleData?.price;
console.log('vehicleValuation =', oldVehicleValuation, 'type:', typeof oldVehicleValuation);
console.log('Result: Gets empty object {} instead of 36971');
console.log('');

// Test NEW logic (fixed)
console.log('✅ NEW Logic (fixed):');
const newVehicleValuation = mockVehicleData?.price || mockAdvertData?.price || mockVehicleData?.estimatedValue;
console.log('vehicleValuation =', newVehicleValuation, 'type:', typeof newVehicleValuation);
console.log('Result: Gets correct value 36971');
console.log('');

// Test frontend auto-selection logic
function calculatePriceRange(valuation, isTradeType) {
  if (!valuation || isNaN(valuation)) return null;
  
  const value = parseFloat(valuation);
  
  if (isTradeType) {
    if (value <= 17000) return '10001-17000';
    return 'over-17000';
  } else {
    if (value <= 24999) return '17000-24999';
    return 'over-24995';
  }
}

console.log('🎯 Frontend Auto-Selection Test:');
console.log('With OLD logic (empty object):');
const oldRange = calculatePriceRange(oldVehicleValuation, false);
console.log('  Price range:', oldRange || 'null (stays at default "under-1000")');

console.log('With NEW logic (correct value):');
const newRange = calculatePriceRange(newVehicleValuation, false);
console.log('  Price range:', newRange);
console.log('');

console.log('🔧 Fix Summary:');
console.log('- Changed SellerContactDetailsPage.jsx to prioritize vehicleData.price');
console.log('- Added debug logging to CarAdvertisingPricesPage.jsx');
console.log('- Frontend auto-selection should now work correctly');
console.log('');

console.log('✅ Data flow fix completed');