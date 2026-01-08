const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing postcode search API directly...\n');
    
    // Test 1: Search with postcode
    console.log('🧪 Test 1: Search with postcode L1 8JQ');
    const response1 = await axios.get('http://localhost:5000/api/postcode/search?postcode=L1%208JQ&radius=25');
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(response1.data, null, 2));
    
    // Test 2: Search with different postcode
    console.log('\n🧪 Test 2: Search with postcode SW1A 1AA');
    const response2 = await axios.get('http://localhost:5000/api/postcode/search?postcode=SW1A%201AA&radius=25');
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(response2.data, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

testAPI();
