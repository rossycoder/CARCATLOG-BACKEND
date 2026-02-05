// Test the current server response to see if the fix is working

async function testCurrentServerResponse() {
  console.log('🧪 Testing Current Server Response');
  console.log('=' .repeat(60));
  
  const API_BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('📡 Making API call to enhanced lookup...');
    const response = await fetch(`${API_BASE_URL}/vehicles/enhanced-lookup/BG22UCP?mileage=2500&t=${Date.now()}`);
    
    if (!response.ok) {
      console.log(`❌ API call failed with status: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API call successful');
    console.log('');
    
    console.log('🔍 Response Analysis:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Has data: ${!!data.data}`);
    console.log('');
    
    if (data.data) {
      console.log('📊 Key fields:');
      console.log(`   make: ${data.data.make}`);
      console.log(`   model: ${data.data.model}`);
      console.log(`   year: ${data.data.year}`);
      console.log(`   price: ${data.data.price} (${typeof data.data.price})`);
      console.log('');
      
      console.log('💰 Valuation data:');
      if (data.data.valuation && data.data.valuation.estimatedValue) {
        const val = data.data.valuation.estimatedValue;
        console.log(`   private: £${val.private}`);
        console.log(`   retail: £${val.retail}`);
        console.log(`   trade: £${val.trade}`);
        console.log('');
        
        // Check if the fix is working
        if (data.data.price === val.private) {
          console.log('✅ SUCCESS: Fix is working!');
          console.log(`   Price field (${data.data.price}) matches private sale value (${val.private})`);
          
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
          console.log('');
          console.log('🎯 Price Range Test:');
          console.log(`   Price: £${data.data.price.toLocaleString()}`);
          console.log(`   Expected range: ${expectedRange}`);
          console.log(`   Should auto-select: ${expectedRange}`);
          console.log(`   Matches backend expectation: ${expectedRange === 'over-24995' ? '✅ YES' : '❌ NO'}`);
          
        } else if (!data.data.price) {
          console.log('❌ ISSUE: Price field is not set');
          console.log('   This means the fix is not being applied');
          console.log('   Possible causes:');
          console.log('   1. Server needs to be restarted');
          console.log('   2. Fix is in wrong location');
          console.log('   3. Code is not being executed');
          
        } else {
          console.log('❌ ISSUE: Price field has wrong value');
          console.log(`   Expected: ${val.private}`);
          console.log(`   Got: ${data.data.price}`);
        }
        
      } else {
        console.log('   No valuation data found');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 Possible issues:');
    console.log('1. Development server is not running');
    console.log('2. Server is running on different port');
    console.log('3. Network connectivity issue');
    console.log('');
    console.log('🔧 Solutions:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Check if server is running on port 5000');
    console.log('3. Restart the server to apply the fix');
  }
}

// Run the test
testCurrentServerResponse()
  .then(() => {
    console.log('');
    console.log('🎯 Test completed');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });