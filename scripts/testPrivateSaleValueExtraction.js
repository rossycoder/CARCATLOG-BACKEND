const mongoose = require('mongoose');
require('dotenv').config();

async function testPrivateSaleValueExtraction() {
  try {
    console.log('🧪 Testing Private Sale Value Extraction Fix');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ MongoDB Connected');
    
    // Test the enhanced lookup endpoint
    const API_BASE_URL = 'http://localhost:5000/api';
    
    console.log('🔍 Testing enhanced lookup for BG22UCP...');
    
    const response = await fetch(`${API_BASE_URL}/vehicles/enhanced-lookup/BG22UCP?mileage=2500`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Enhanced lookup successful');
      console.log('');
      
      // Check if price field is now populated
      console.log('🔍 Checking price field extraction:');
      console.log(`   vehicleData.price: ${data.data.price}`);
      console.log(`   vehicleData.price type: ${typeof data.data.price}`);
      console.log('');
      
      // Check valuation data
      if (data.data.valuation && data.data.valuation.estimatedValue) {
        console.log('💰 Valuation data found:');
        console.log(`   Private: £${data.data.valuation.estimatedValue.private}`);
        console.log(`   Retail: £${data.data.valuation.estimatedValue.retail}`);
        console.log(`   Trade: £${data.data.valuation.estimatedValue.trade}`);
        console.log('');
        
        // Verify the price field matches private sale value
        const privateSaleValue = data.data.valuation.estimatedValue.private;
        const priceField = data.data.price;
        
        if (priceField && priceField === privateSaleValue) {
          console.log('✅ SUCCESS: price field correctly set to private sale value');
          console.log(`   Expected: £${privateSaleValue}`);
          console.log(`   Got: £${priceField}`);
        } else {
          console.log('❌ ISSUE: price field does not match private sale value');
          console.log(`   Private sale value: £${privateSaleValue}`);
          console.log(`   Price field: £${priceField}`);
        }
      } else {
        console.log('⚠️ No valuation data found');
      }
      
      console.log('');
      console.log('🎯 Frontend Auto-Selection Test:');
      
      // Test the price range calculation logic
      function calculatePriceRange(valuation, isTradeType) {
        if (!valuation || isNaN(valuation)) return null;
        
        const value = parseFloat(valuation);
        
        if (isTradeType) {
          if (value < 1000) return 'under-1000';
          if (value <= 2000) return '1001-2000';
          if (value <= 3000) return '2001-3000';
          if (value <= 5000) return '3001-5000';
          if (value <= 7000) return '5001-7000';
          if (value <= 10000) return '7001-10000';
          if (value <= 17000) return '10001-17000';
          return 'over-17000';
        } else {
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
      
      if (data.data.price) {
        const expectedRange = calculatePriceRange(data.data.price, false);
        console.log(`   Price: £${data.data.price.toLocaleString()}`);
        console.log(`   Expected range: ${expectedRange}`);
        console.log(`   Should auto-select: ${expectedRange === 'over-24995' ? '✅ over-24995 (CORRECT)' : '❌ ' + expectedRange}`);
      }
      
    } else {
      console.log('❌ Enhanced lookup failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('🔌 MongoDB disconnected');
  }
}

// Run the test
testPrivateSaleValueExtraction()
  .then(() => {
    console.log('');
    console.log('🎯 Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });