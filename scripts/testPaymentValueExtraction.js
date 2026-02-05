const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Test the payment value extraction logic that should be happening in frontend
async function testPaymentValueExtraction() {
  try {
    console.log('🧪 Testing Payment Value Extraction Logic');
    console.log('=====================================');
    
    // Simulate the data that would be available in CarAdvertisingPricesPage
    const testScenarios = [
      {
        name: 'BMW i4 M50 - Complete Data',
        vehicleValuation: null,
        advertData: { price: 36971 },
        vehicleData: {
          valuation: {
            estimatedValue: {
              private: 36971,
              retail: 41550,
              trade: 34694
            }
          },
          allValuations: {
            private: 36971,
            retail: 41550,
            trade: 34694
          },
          estimatedValue: 36971,
          price: 36971
        }
      },
      {
        name: 'BMW i4 M50 - Object EstimatedValue (Problem Case)',
        vehicleValuation: null,
        advertData: { price: {} }, // This is the problem - empty object
        vehicleData: {
          valuation: {
            estimatedValue: {} // Empty object causing the issue
          },
          estimatedValue: {}, // Empty object
          price: 36971
        }
      },
      {
        name: 'BMW i4 M50 - Mixed Data Types',
        vehicleValuation: 36971,
        advertData: { price: "[object Object]" }, // String representation of object
        vehicleData: {
          valuation: {
            estimatedValue: {
              private: 36971
            }
          }
        }
      }
    ];
    
    // Test the extraction logic for each scenario
    testScenarios.forEach((scenario, index) => {
      console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
      console.log('-------------------------------------------');
      
      const { vehicleValuation, advertData, vehicleData } = scenario;
      
      // This is the exact logic from CarAdvertisingPricesPage.jsx
      let actualVehicleValue = null;
      
      if (vehicleValuation && typeof vehicleValuation === 'number') {
        actualVehicleValue = vehicleValuation;
        console.log('✅ Using vehicleValuation:', actualVehicleValue);
      } else if (advertData?.price && typeof advertData.price === 'number') {
        actualVehicleValue = advertData.price;
        console.log('✅ Using advertData.price:', actualVehicleValue);
      } else if (vehicleData?.valuation?.estimatedValue?.private) {
        actualVehicleValue = vehicleData.valuation.estimatedValue.private;
        console.log('✅ Using vehicleData.valuation.estimatedValue.private:', actualVehicleValue);
      } else if (vehicleData?.valuation?.estimatedValue?.retail) {
        actualVehicleValue = vehicleData.valuation.estimatedValue.retail;
        console.log('✅ Using vehicleData.valuation.estimatedValue.retail:', actualVehicleValue);
      } else if (vehicleData?.allValuations?.private) {
        actualVehicleValue = vehicleData.allValuations.private;
        console.log('✅ Using vehicleData.allValuations.private:', actualVehicleValue);
      } else if (vehicleData?.estimatedValue && typeof vehicleData.estimatedValue === 'number') {
        actualVehicleValue = vehicleData.estimatedValue;
        console.log('✅ Using vehicleData.estimatedValue:', actualVehicleValue);
      } else if (vehicleData?.price && typeof vehicleData.price === 'number') {
        actualVehicleValue = vehicleData.price;
        console.log('✅ Using vehicleData.price:', actualVehicleValue);
      }
      
      console.log('🔍 Debug Info:');
      console.log('  - vehicleValuation:', vehicleValuation, typeof vehicleValuation);
      console.log('  - advertData.price:', advertData?.price, typeof advertData?.price);
      console.log('  - vehicleData.valuation.estimatedValue:', vehicleData?.valuation?.estimatedValue);
      console.log('  - vehicleData.estimatedValue:', vehicleData?.estimatedValue, typeof vehicleData?.estimatedValue);
      console.log('  - vehicleData.price:', vehicleData?.price, typeof vehicleData?.price);
      
      console.log(`💰 Final actualVehicleValue: ${actualVehicleValue} (${typeof actualVehicleValue})`);
      
      if (actualVehicleValue === null || typeof actualVehicleValue !== 'number') {
        console.log('❌ PROBLEM: actualVehicleValue is not a valid number!');
        console.log('   This would cause the "[object Object]" error in payment');
      } else {
        console.log('✅ SUCCESS: actualVehicleValue is a valid number');
      }
    });
    
    console.log('\n🎯 SOLUTION RECOMMENDATIONS:');
    console.log('=============================');
    console.log('1. Check browser console for debugging logs when loading the page');
    console.log('2. Hard refresh the browser (Ctrl+F5) to clear JavaScript cache');
    console.log('3. If logs don\'t appear, restart the frontend dev server');
    console.log('4. Look for these specific console messages:');
    console.log('   - "🔍 DEBUGGING: useEffect triggered with data:"');
    console.log('   - "💰 Payment request vehicle value extraction:"');
    console.log('   - "✅ Using vehicleData.valuation.estimatedValue.private: 36971"');
    
    console.log('\n📊 Expected Console Output:');
    console.log('When the page loads, you should see:');
    console.log('🔍 DEBUGGING: useEffect triggered with data: {...}');
    console.log('✅ Using vehicleData.valuation.estimatedValue.private: 36971');
    console.log('💰 Valuation extraction debug: {...}');
    console.log('🔒 Auto-selected price range: over-24995 for valuation: £36971');
    
    console.log('\nWhen clicking payment:');
    console.log('💰 Payment request vehicle value extraction: {');
    console.log('  actualVehicleValue: 36971,');
    console.log('  priceRange: "over-24995",');
    console.log('  ...}');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentValueExtraction();