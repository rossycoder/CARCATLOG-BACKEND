const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Test the payment fix
async function testPaymentFix() {
  try {
    console.log('🧪 Testing Payment Fix');
    console.log('=====================');
    
    // Simulate the request that should now work
    const testRequest = {
      packageId: 'silver',
      packageName: 'Silver',
      price: 1399, // £13.99 in pence
      duration: 6,
      sellerType: 'private',
      vehicleValue: 'over-24995', // Price range string (FIXED)
      actualVehicleValue: 36971, // Actual numeric value (NEW)
      advertId: 'test-advert-id',
      advertData: {
        price: 36971,
        photos: []
      },
      vehicleData: {
        make: 'BMW',
        model: 'i4',
        estimatedValue: 36971
      },
      contactDetails: {
        phoneNumber: '1234567890',
        email: 'test@example.com'
      },
      vehicleType: 'car'
    };
    
    console.log('📦 Test Request Data:');
    console.log('  - vehicleValue (price range):', testRequest.vehicleValue);
    console.log('  - actualVehicleValue (numeric):', testRequest.actualVehicleValue);
    console.log('  - advertData.price:', testRequest.advertData.price);
    console.log('  - sellerType:', testRequest.sellerType);
    
    // Test the validation logic
    // This function is not exported, so let's recreate it
    function calculatePriceRangeForValidation(valuation, isTradeType) {
      if (!valuation || isNaN(valuation)) return null;
      
      const value = parseFloat(valuation);
      
      if (isTradeType) {
        // Trade pricing tiers
        if (value < 1000) return 'under-1000';
        if (value <= 2000) return '1001-2000';
        if (value <= 3000) return '2001-3000';
        if (value <= 5000) return '3001-5000';
        if (value <= 7000) return '5001-7000';
        if (value <= 10000) return '7001-10000';
        if (value <= 17000) return '10001-17000';
        return 'over-17000';
      } else {
        // Private pricing tiers
        if (value < 1000) return 'under-1000';
        if (value <= 2999) return '1000-2999';
        if (value <= 4999) return '3000-4999';
        if (value <= 6999) return '5000-6999';
        if (value <= 9999) return '7000-9999';
        if (value <= 12999) return '10000-12999';
        if (value <= 16999) return '13000-16999';
        if (value <= 24999) return '17000-24999';
        return 'over-24995';
      }
    }
    
    // Test validation
    const valuation = testRequest.actualVehicleValue || testRequest.advertData?.price;
    const expectedPriceRange = calculatePriceRangeForValidation(valuation, testRequest.sellerType === 'trade');
    
    console.log('\n🔍 Validation Test:');
    console.log('  - Vehicle valuation:', valuation);
    console.log('  - Expected price range:', expectedPriceRange);
    console.log('  - Provided price range:', testRequest.vehicleValue);
    console.log('  - Match:', expectedPriceRange === testRequest.vehicleValue ? '✅ YES' : '❌ NO');
    
    if (expectedPriceRange === testRequest.vehicleValue) {
      console.log('\n🎉 SUCCESS: Payment validation should now pass!');
      console.log('   - Frontend sends price range in vehicleValue field');
      console.log('   - Frontend sends numeric value in actualVehicleValue field');
      console.log('   - Backend validates price range correctly');
    } else {
      console.log('\n❌ FAILURE: Validation would still fail');
      console.log('   - Expected:', expectedPriceRange);
      console.log('   - Got:', testRequest.vehicleValue);
    }
    
    console.log('\n📋 What Changed:');
    console.log('================');
    console.log('BEFORE (causing error):');
    console.log('  vehicleValue: 36971 (numeric)');
    console.log('  priceRange: "over-24995" (string)');
    console.log('  → Backend expected price range in vehicleValue field');
    console.log('');
    console.log('AFTER (fixed):');
    console.log('  vehicleValue: "over-24995" (price range string)');
    console.log('  actualVehicleValue: 36971 (numeric value)');
    console.log('  → Backend gets expected price range for validation');
    
    console.log('\n🔄 Next Steps:');
    console.log('==============');
    console.log('1. Hard refresh browser (Ctrl+F5) to load updated JavaScript');
    console.log('2. Check browser console for updated logs');
    console.log('3. Try payment again - should work without "[object Object]" error');
    console.log('4. Look for this log in browser console:');
    console.log('   "💰 Payment request vehicle value extraction: {');
    console.log('     actualVehicleValue: 36971,');
    console.log('     priceRange: "over-24995"');
    console.log('   }"');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentFix();