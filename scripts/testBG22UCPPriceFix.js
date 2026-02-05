/**
 * Test the BG22UCP price fix with real data
 */

const mongoose = require('mongoose');
const EnhancedVehicleService = require('../services/enhancedVehicleService');
require('dotenv').config();

async function testBG22UCPPriceFix() {
  try {
    console.log('🧪 Testing BG22UCP Price Fix with Real Data');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const vrm = 'BG22UCP';
    const mileage = 2500;
    
    console.log(`\n🔍 Testing enhanced vehicle lookup for: ${vrm}`);
    
    // Clear cache first to force fresh API call
    await EnhancedVehicleService.clearCache(vrm);
    console.log('🗑️ Cache cleared');
    
    // Get enhanced vehicle data
    const result = await EnhancedVehicleService.getEnhancedVehicleData(vrm, true, mileage);
    
    console.log('\n📊 Enhanced Vehicle Data Result:');
    console.log('- Registration:', result.registration);
    console.log('- Make:', result.make?.value || result.make);
    console.log('- Model:', result.model?.value || result.model);
    console.log('- Year:', result.year?.value || result.year);
    
    if (result.valuation) {
      console.log('\n💰 Valuation Data:');
      console.log('- VRM:', result.valuation.vrm);
      console.log('- Mileage:', result.valuation.mileage);
      console.log('- Confidence:', result.valuation.confidence);
      console.log('- Source:', result.valuation.source);
      console.log('- EstimatedValue:', JSON.stringify(result.valuation.estimatedValue, null, 2));
      
      if (result.valuation.estimatedValue && Object.keys(result.valuation.estimatedValue).length > 0) {
        console.log('✅ EstimatedValue is properly populated');
        console.log('- Private:', result.valuation.estimatedValue.private);
        console.log('- Retail:', result.valuation.estimatedValue.retail);
        console.log('- Trade:', result.valuation.estimatedValue.trade);
      } else {
        console.log('❌ EstimatedValue is empty or missing');
      }
    } else {
      console.log('❌ No valuation data found');
    }
    
    // Test cache retrieval
    console.log('\n🔄 Testing cache retrieval...');
    const cachedResult = await EnhancedVehicleService.getEnhancedVehicleData(vrm, true, mileage);
    
    if (cachedResult.valuation) {
      console.log('💰 Cached Valuation Data:');
      console.log('- EstimatedValue:', JSON.stringify(cachedResult.valuation.estimatedValue, null, 2));
      
      if (cachedResult.valuation.estimatedValue && Object.keys(cachedResult.valuation.estimatedValue).length > 0) {
        console.log('✅ Cached EstimatedValue is properly populated');
        
        // Test frontend price display logic
        const mockVehicleData = {
          valuation: cachedResult.valuation,
          allValuations: cachedResult.valuation.estimatedValue,
          estimatedValue: cachedResult.valuation.estimatedValue.private || cachedResult.valuation.estimatedValue.retail,
          price: cachedResult.valuation.estimatedValue.private
        };
        
        const mockAdvertData = { price: 0 }; // Simulate "Not set"
        
        // Frontend price display logic
        let displayPrice = null;
        
        if (mockAdvertData.price && mockAdvertData.price > 0) {
          displayPrice = mockAdvertData.price;
        } else if (mockVehicleData?.valuation?.estimatedValue?.private && mockVehicleData.valuation.estimatedValue.private > 0) {
          displayPrice = mockVehicleData.valuation.estimatedValue.private;
        } else if (mockVehicleData?.valuation?.estimatedValue?.retail && mockVehicleData.valuation.estimatedValue.retail > 0) {
          displayPrice = mockVehicleData.valuation.estimatedValue.retail;
        }
        
        console.log('\n🎯 Frontend Price Display Test:');
        console.log('- Display Price:', displayPrice ? `£${displayPrice.toLocaleString()}` : 'Not set');
        
        if (displayPrice && displayPrice > 0) {
          console.log('🎉 SUCCESS: Frontend will show the correct price!');
        } else {
          console.log('❌ FAILED: Frontend will still show "Not set"');
        }
      } else {
        console.log('❌ Cached EstimatedValue is still empty');
      }
    } else {
      console.log('❌ No cached valuation data found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testBG22UCPPriceFix();