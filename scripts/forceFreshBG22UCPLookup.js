const mongoose = require('mongoose');
require('dotenv').config();

async function forceFreshBG22UCPLookup() {
  try {
    console.log('🔄 Forcing Fresh BG22UCP Lookup');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ MongoDB Connected');
    
    // Delete all cached data for BG22UCP
    const VehicleHistory = require('../models/VehicleHistory');
    await VehicleHistory.deleteMany({ vrm: 'BG22UCP' });
    console.log('🗑️ Cleared all cached data for BG22UCP');
    
    // Also clear any other cache collections that might exist
    try {
      const CachedValuation = require('../models/CachedValuation');
      await CachedValuation.deleteMany({ vrm: 'BG22UCP' });
      console.log('🗑️ Cleared cached valuations for BG22UCP');
    } catch (e) {
      // Model might not exist, that's ok
    }
    
    console.log('');
    console.log('🧪 Testing fresh lookup...');
    
    // Test the enhanced lookup with cache disabled
    const API_BASE_URL = 'http://localhost:5000/api';
    
    try {
      // Force fresh lookup by adding a cache-busting parameter
      const response = await fetch(`${API_BASE_URL}/vehicles/enhanced-lookup/BG22UCP?mileage=2500&fresh=true&t=${Date.now()}`);
      const data = await response.json();
      
      console.log('📡 API Response received');
      console.log(`   Success: ${data.success}`);
      
      if (data.success) {
        console.log('');
        console.log('🔍 Checking response data:');
        console.log(`   Price field: ${data.data.price}`);
        console.log(`   Price type: ${typeof data.data.price}`);
        console.log(`   Valuation object:`, JSON.stringify(data.data.valuation, null, 2));
        
        if (data.data.price && typeof data.data.price === 'number') {
          console.log('');
          console.log('✅ SUCCESS: Price field is now populated!');
          console.log(`   Private sale value: £${data.data.price.toLocaleString()}`);
          
          // Test price range calculation
          function calculatePriceRange(valuation) {
            const value = parseFloat(valuation);
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
          
          const expectedRange = calculatePriceRange(data.data.price);
          console.log(`   Expected price range: ${expectedRange}`);
          console.log(`   Should match backend expectation: ${expectedRange === 'over-24995' ? '✅ YES' : '❌ NO'}`);
          
        } else {
          console.log('');
          console.log('❌ Price field still not populated');
          console.log('   This suggests the valuation data is still empty');
        }
        
      } else {
        console.log('❌ API call failed:', data.error);
      }
      
    } catch (fetchError) {
      console.log('⚠️ Could not test API (server might not be running)');
      console.log('   Error:', fetchError.message);
      console.log('');
      console.log('💡 Manual test instructions:');
      console.log('1. Make sure your development server is running');
      console.log('2. Navigate to the car advert edit page for BG22UCP');
      console.log('3. Check if the price field is now populated');
      console.log('4. Try the payment flow to see if price range auto-selects');
    }
    
  } catch (error) {
    console.error('❌ Fresh lookup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('🔌 MongoDB disconnected');
  }
}

// Run the fresh lookup
forceFreshBG22UCPLookup()
  .then(() => {
    console.log('');
    console.log('🎯 Fresh lookup completed');
    console.log('');
    console.log('📋 What to do next:');
    console.log('1. Refresh your browser page');
    console.log('2. The car should now have proper valuation data');
    console.log('3. Try the payment flow - it should auto-select "over-24995"');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fresh lookup failed:', error);
    process.exit(1);
  });