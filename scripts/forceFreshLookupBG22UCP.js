/**
 * Force a fresh lookup for BG22UCP by calling the enhanced service with useCache=false
 */

require('dotenv').config();
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function forceFreshLookup() {
  try {
    console.log('🔄 Forcing fresh lookup for BG22UCP (bypassing cache)...');
    
    // Call with useCache=false to force fresh API calls
    const result = await enhancedVehicleService.getEnhancedVehicleData('BG22UCP', false, 2500);
    
    console.log('\n📊 FRESH LOOKUP RESULT:');
    console.log('Success:', !!result);
    console.log('Has valuation:', !!result.valuation);
    
    if (result.valuation) {
      console.log('\n💰 VALUATION OBJECT:');
      console.log('VRM:', result.valuation.vrm);
      console.log('Mileage:', result.valuation.mileage);
      console.log('EstimatedValue:', JSON.stringify(result.valuation.estimatedValue));
      
      if (result.valuation.estimatedValue && result.valuation.estimatedValue.private) {
        console.log('\n✅ SUCCESS: Fresh lookup returned correct valuation!');
        console.log('💷 Private sale: £' + result.valuation.estimatedValue.private);
        console.log('\n🔄 This fresh data should now be cached with the correct format');
        console.log('🎯 Next cache hit should return the correct price');
      } else {
        console.log('\n❌ Fresh lookup still has empty estimatedValue');
      }
    } else {
      console.log('❌ No valuation object in fresh lookup');
    }
    
  } catch (error) {
    console.error('❌ Fresh lookup failed:', error.message);
  }
}

forceFreshLookup();