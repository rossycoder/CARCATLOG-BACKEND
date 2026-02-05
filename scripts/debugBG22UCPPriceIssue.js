/**
 * Debug the BG22UCP price issue - check what's in cache and why estimatedValue is empty
 */

const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const EnhancedVehicleService = require('../services/enhancedVehicleService');
require('dotenv').config();

async function debugBG22UCPPriceIssue() {
  try {
    console.log('🔍 Debugging BG22UCP Price Issue');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const vrm = 'BG22UCP';
    
    // 1. Check what's currently in the cache
    console.log('\n📊 Step 1: Checking current cache data');
    const cachedData = await VehicleHistory.findOne({ vrm: vrm.toUpperCase() });
    
    if (cachedData) {
      console.log('✅ Found cached data:');
      console.log('- VRM:', cachedData.vrm);
      console.log('- Check Date:', cachedData.checkDate);
      console.log('- Has Valuation:', !!cachedData.valuation);
      
      if (cachedData.valuation) {
        console.log('💰 Cached Valuation Data:');
        console.log('- Private Price:', cachedData.valuation.privatePrice);
        console.log('- Dealer Price:', cachedData.valuation.dealerPrice);
        console.log('- Part Exchange Price:', cachedData.valuation.partExchangePrice);
        console.log('- Estimated Value:', JSON.stringify(cachedData.valuation.estimatedValue));
        console.log('- Estimated Value Type:', typeof cachedData.valuation.estimatedValue);
        console.log('- Estimated Value Keys:', Object.keys(cachedData.valuation.estimatedValue || {}));
      } else {
        console.log('❌ No valuation data in cache');
      }
    } else {
      console.log('❌ No cached data found');
    }
    
    // 2. Test the enhanced vehicle service directly
    console.log('\n🔧 Step 2: Testing Enhanced Vehicle Service');
    const enhancedResult = await EnhancedVehicleService.getEnhancedVehicleData(vrm, true, 2500);
    
    console.log('📦 Enhanced Service Result:');
    console.log('- Registration:', enhancedResult.registration);
    console.log('- Has Valuation:', !!enhancedResult.valuation);
    
    if (enhancedResult.valuation) {
      console.log('💰 Enhanced Service Valuation:');
      console.log('- VRM:', enhancedResult.valuation.vrm);
      console.log('- Mileage:', enhancedResult.valuation.mileage);
      console.log('- Confidence:', enhancedResult.valuation.confidence);
      console.log('- Source:', enhancedResult.valuation.source);
      console.log('- Estimated Value:', JSON.stringify(enhancedResult.valuation.estimatedValue));
      console.log('- Estimated Value Type:', typeof enhancedResult.valuation.estimatedValue);
      console.log('- Estimated Value Keys:', Object.keys(enhancedResult.valuation.estimatedValue || {}));
      
      // Check if estimatedValue is empty
      if (enhancedResult.valuation.estimatedValue && Object.keys(enhancedResult.valuation.estimatedValue).length === 0) {
        console.log('❌ PROBLEM: EstimatedValue is empty object!');
        
        // Check if we can reconstruct it
        console.log('\n🔧 Attempting manual reconstruction:');
        if (cachedData?.valuation?.privatePrice) {
          const reconstructed = {
            private: cachedData.valuation.privatePrice,
            retail: cachedData.valuation.dealerPrice,
            trade: cachedData.valuation.partExchangePrice
          };
          console.log('✅ Can reconstruct from cached data:', JSON.stringify(reconstructed));
        } else {
          console.log('❌ Cannot reconstruct - no individual price fields');
        }
      } else {
        console.log('✅ EstimatedValue has data');
      }
    } else {
      console.log('❌ No valuation in enhanced service result');
    }
    
    // 3. Clear cache and test fresh API call
    console.log('\n🗑️ Step 3: Clearing cache and testing fresh API call');
    await EnhancedVehicleService.clearCache(vrm);
    console.log('✅ Cache cleared');
    
    const freshResult = await EnhancedVehicleService.getEnhancedVehicleData(vrm, false, 2500);
    
    console.log('🆕 Fresh API Result:');
    if (freshResult.valuation) {
      console.log('💰 Fresh Valuation:');
      console.log('- Estimated Value:', JSON.stringify(freshResult.valuation.estimatedValue));
      console.log('- Estimated Value Type:', typeof freshResult.valuation.estimatedValue);
      console.log('- Estimated Value Keys:', Object.keys(freshResult.valuation.estimatedValue || {}));
      
      if (freshResult.valuation.estimatedValue && Object.keys(freshResult.valuation.estimatedValue).length > 0) {
        console.log('🎉 SUCCESS: Fresh API call has proper estimatedValue!');
        console.log('- Private:', freshResult.valuation.estimatedValue.private);
        console.log('- Retail:', freshResult.valuation.estimatedValue.retail);
        console.log('- Trade:', freshResult.valuation.estimatedValue.trade);
      } else {
        console.log('❌ FAILED: Fresh API call still has empty estimatedValue');
      }
    } else {
      console.log('❌ No valuation in fresh result');
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugBG22UCPPriceIssue();