/**
 * Test bike listing API to verify bikes are being returned correctly
 */

const axios = require('axios');

async function testBikeListingAPI() {
  try {
    console.log('🏍️ TESTING BIKE LISTING API');
    console.log('='.repeat(50));

    const baseURL = 'http://localhost:5000';
    
    // Test 1: Get all bikes
    console.log('📡 TEST 1: GET /api/bikes');
    try {
      const response = await axios.get(`${baseURL}/api/bikes`);
      
      if (response.data.success) {
        console.log('✅ API Response successful');
        console.log(`   Total bikes: ${response.data.data.total}`);
        console.log(`   Bikes returned: ${response.data.data.bikes.length}`);
        
        if (response.data.data.bikes.length > 0) {
          console.log('');
          console.log('🏍️ BIKES FOUND:');
          response.data.data.bikes.forEach((bike, index) => {
            console.log(`   ${index + 1}. ${bike.make} ${bike.model} (${bike.year})`);
            console.log(`      Price: £${bike.price?.toLocaleString() || 'Not set'}`);
            console.log(`      Status: ${bike.status}`);
            console.log(`      ID: ${bike._id}`);
            console.log('');
          });
        } else {
          console.log('⚠️ No bikes returned from API');
        }
      } else {
        console.log('❌ API returned error:', response.data.message);
      }
    } catch (error) {
      console.log('❌ API request failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('   Make sure your backend server is running on localhost:5000');
      }
    }

    console.log('');
    console.log('-'.repeat(50));

    // Test 2: Search bikes with filters
    console.log('📡 TEST 2: GET /api/bikes/search-filtered');
    try {
      const response = await axios.get(`${baseURL}/api/bikes/search-filtered?make=YAMAHA`);
      
      if (response.data.success) {
        console.log('✅ Search API Response successful');
        console.log(`   Filtered bikes: ${response.data.data.bikes.length}`);
        
        if (response.data.data.bikes.length > 0) {
          console.log('');
          console.log('🔍 YAMAHA BIKES FOUND:');
          response.data.data.bikes.forEach((bike, index) => {
            console.log(`   ${index + 1}. ${bike.make} ${bike.model} - £${bike.price?.toLocaleString()}`);
          });
        }
      } else {
        console.log('❌ Search API returned error:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Search API request failed:', error.message);
    }

    console.log('');
    console.log('-'.repeat(50));

    // Test 3: Check bike count
    console.log('📡 TEST 3: GET /api/bikes/count');
    try {
      const response = await axios.get(`${baseURL}/api/bikes/count`);
      
      if (response.data.success) {
        console.log('✅ Count API Response successful');
        console.log(`   Total active bikes: ${response.data.data.total}`);
      } else {
        console.log('❌ Count API returned error:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Count API request failed:', error.message);
    }

    console.log('');
    console.log('🎯 SUMMARY:');
    console.log('   If all tests pass, your bikes should show in frontend');
    console.log('   If tests fail, check:');
    console.log('   1. Backend server is running (npm run dev)');
    console.log('   2. Database connection is working');
    console.log('   3. Bike status is "active"');
    console.log('   4. Frontend is calling correct API endpoints');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBikeListingAPI();