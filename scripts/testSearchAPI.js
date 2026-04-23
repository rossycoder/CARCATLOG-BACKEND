require('dotenv').config();
const axios = require('axios');

async function testSearchAPI() {
  try {
    const baseURL = process.env.API_URL || 'http://localhost:5000';
    
    console.log('🔍 Testing Search API...\n');
    
    // Test 1: Search all cars (no filters)
    console.log('Test 1: Search ALL cars (no filters)');
    const response1 = await axios.get(`${baseURL}/api/vehicles/search`);
    console.log(`✅ Found ${response1.data.total} cars`);
    console.log(`✅ Returned ${response1.data.cars.length} cars in response\n`);
    
    // Test 2: Count active cars
    console.log('Test 2: Get car count');
    const response2 = await axios.get(`${baseURL}/api/vehicles/count`);
    console.log(`✅ Car count: ${response2.data.count}\n`);
    
    // Test 3: Search with sort by newest
    console.log('Test 3: Search sorted by newest');
    const response3 = await axios.get(`${baseURL}/api/vehicles/search?sort=newest`);
    console.log(`✅ Found ${response3.data.total} cars`);
    console.log(`✅ Returned ${response3.data.cars.length} cars in response`);
    
    if (response3.data.cars.length > 0) {
      console.log('\nFirst 5 cars:');
      response3.data.cars.slice(0, 5).forEach((car, i) => {
        console.log(`${i + 1}. ${car.make} ${car.model} (${car.year}) - ${car.registrationNumber} - Status: ${car.advertStatus}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSearchAPI();
