/**
 * Debug the valuation issue step by step
 */

require('dotenv').config();
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function debugValuationIssue() {
  try {
    console.log('🔍 Debugging Valuation Issue for BG22UCP');
    console.log('==========================================');
    
    const registration = 'BG22UCP';
    
    console.log('\n1️⃣ Testing enhanced vehicle service directly...');
    const result = await enhancedVehicleService.getEnhancedVehicleData(registration, true, 2500);
    
    console.log('\n📊 ENHANCED SERVICE RESULT:');
    console.log('Success:', !!result);
    console.log('Has valuation:', !!result.valuation);
    
    if (result.valuation) {
      console.log('\n💰 VALUATION OBJECT:');
      console.log('VRM:', result.valuation.vrm);
      console.log('Mileage:', result.valuation.mileage);
      console.log('Confidence:', result.valuation.confidence);
      console.log('Source:', result.valuation.source);
      console.log('EstimatedValue:', JSON.stringify(result.valuation.estimatedValue));
      console.log('EstimatedValue type:', typeof result.valuation.estimatedValue);
      console.log('EstimatedValue keys:', Object.keys(result.valuation.estimatedValue || {}));
      
      if (result.valuation.estimatedValue) {
        console.log('\n💷 PRICE BREAKDOWN:');
        console.log('Private:', result.valuation.estimatedValue.private);
        console.log('Retail:', result.valuation.estimatedValue.retail);
        console.log('Trade:', result.valuation.estimatedValue.trade);
      }
    } else {
      console.log('❌ No valuation object found');
    }
    
    console.log('\n2️⃣ Testing data sources...');
    console.log('Data sources:', result.dataSources);
    console.log('Has CheckCarDetails:', result.dataSources?.checkCarDetails);
    console.log('Has valuation flag:', result.dataSources?.valuation);
    
    console.log('\n3️⃣ Testing cache analysis...');
    // The cache analysis should show if valuation data exists
    
    console.log('\n🎯 DIAGNOSIS:');
    if (result.valuation && result.valuation.estimatedValue && Object.keys(result.valuation.estimatedValue).length > 0) {
      console.log('✅ Enhanced service is returning correct valuation data');
      console.log('🔍 Issue might be in vehicle controller unwrapping process');
    } else {
      console.log('❌ Enhanced service is not returning correct valuation data');
      console.log('🔍 Issue is in enhanced service cache reconstruction');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugValuationIssue();