const axios = require('axios');

const BACKEND_URL = 'https://carcatlog-backend-1.onrender.com';

async function testBackend() {
  console.log('Testing Render backend health...\n');
  
  try {
    // Test basic health endpoint
    console.log('1. Testing /health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 10000
    });
    console.log('✓ Health check passed:', healthResponse.data);
    console.log('');
    
    // Test root endpoint
    console.log('2. Testing / endpoint...');
    const rootResponse = await axios.get(`${BACKEND_URL}/`, {
      timeout: 10000
    });
    console.log('✓ Root endpoint passed:', rootResponse.data);
    console.log('');
    
    // Test CORS headers
    console.log('3. Checking CORS headers...');
    console.log('Access-Control-Allow-Origin:', healthResponse.headers['access-control-allow-origin'] || 'NOT SET');
    console.log('Access-Control-Allow-Credentials:', healthResponse.headers['access-control-allow-credentials'] || 'NOT SET');
    console.log('');
    
    console.log('✅ Backend is running and healthy!');
    
  } catch (error) {
    console.error('❌ Backend test failed:');
    if (error.code === 'ECONNABORTED') {
      console.error('   Connection timeout - backend may be starting up');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused - backend is not running');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testBackend();
