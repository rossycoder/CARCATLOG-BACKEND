/**
 * Simple test to verify bike and van routes are working
 */

require('dotenv').config();
const axios = require('axios');

async function testBikeVanRoutes() {
  try {
    console.log('🔍 Testing Bike and Van Route Registration');
    console.log('='.repeat(50));
    
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Test basic routes first
    const testRoutes = [
      { url: `${baseURL}/api/bikes/count`, name: 'Bike Count' },
      { url: `${baseURL}/api/vans/count`, name: 'Van Count' },
      { url: `${baseURL}/api/bikes/filter-options`, name: 'Bike Filter Options' },
      { url: `${baseURL}/api/vans/filter-options`, name: 'Van Filter Options' }
    ];
    
    for (const route of testRoutes) {
      try {
        console.log(`\n📡 Testing: ${route.name}`);
        console.log(`   URL: ${route.url}`);
        
        const response = await axios.get(route.url, { timeout: 10000 });
        console.log(`✅ SUCCESS: ${route.name} - Status ${response.status}`);
        
      } catch (error) {
        console.log(`❌ FAILED: ${route.name} - ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
        }
      }
    }
    
    // Test the new lookup routes with a simple registration
    const lookupTests = [
      { url: `${baseURL}/api/bikes/basic-lookup/TEST123?mileage=50000`, name: 'Bike Lookup' },
      { url: `${baseURL}/api/vans/basic-lookup/TEST123?mileage=50000`, name: 'Van Lookup' }
    ];
    
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Testing New Lookup Endpoints');
    
    for (const test of lookupTests) {
      try {
        console.log(`\n📡 Testing: ${test.name}`);
        console.log(`   URL: ${test.url}`);
        
        const response = await axios.get(test.url, { timeout: 15000 });
        console.log(`✅ ROUTE EXISTS: ${test.name} - Status ${response.status}`);
        
        if (response.data.success === false) {
          console.log(`   Expected failure for test registration: ${response.data.error}`);
        } else {
          console.log(`   Unexpected success - check response`);
        }
        
      } catch (error) {
        if (error.response && error.response.status === 404 && error.response.data.error === 'Route not found') {
          console.log(`❌ ROUTE NOT FOUND: ${test.name} - Route registration issue`);
        } else if (error.response && error.response.status === 400) {
          console.log(`✅ ROUTE EXISTS: ${test.name} - Got expected 400 error for test data`);
        } else {
          console.log(`❌ ERROR: ${test.name} - ${error.message}`);
          if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

testBikeVanRoutes();