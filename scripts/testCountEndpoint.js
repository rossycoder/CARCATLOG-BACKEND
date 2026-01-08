const axios = require('axios');

async function testCountEndpoint() {
  try {
    console.log('Testing /api/vehicles/count endpoint...\n');
    
    const response = await axios.get('http://localhost:5000/api/vehicles/count');
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.count) {
      console.log(`\n✅ Count endpoint working! Total cars: ${response.data.count}`);
    } else {
      console.log('\n⚠️  Unexpected response format');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('Please start the backend server with: npm start');
    } else {
      console.log('❌ Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
  }
}

testCountEndpoint();
