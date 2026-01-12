const axios = require('axios');

const BACKEND_URL = 'https://carcatlog-backend-1.onrender.com';
const FRONTEND_ORIGIN = 'https://carcatlog.vercel.app';

async function testHistoryEndpoint() {
  console.log('Testing vehicle history endpoint...\n');
  
  try {
    // Test the endpoint that's failing
    console.log('Testing: GET /api/vehicle-history/check');
    console.log('With Origin:', FRONTEND_ORIGIN);
    console.log('');
    
    const response = await axios.get(`${BACKEND_URL}/api/vehicle-history/check`, {
      headers: {
        'Origin': FRONTEND_ORIGIN
      },
      params: {
        registration: 'TEST123' // Test registration
      },
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log('Status:', response.status);
    console.log('CORS Header:', response.headers['access-control-allow-origin'] || '❌ NOT SET');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.headers['access-control-allow-origin']) {
      console.log('\n✅ Endpoint is accessible with proper CORS headers');
    } else {
      console.log('\n❌ CORS headers missing');
    }
    
  } catch (error) {
    console.error('❌ Request failed:');
    if (error.code === 'ECONNABORTED') {
      console.error('   Timeout - endpoint took too long to respond');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   CORS Header:', error.response.headers['access-control-allow-origin'] || 'NOT SET');
    } else {
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
    }
  }
}

testHistoryEndpoint();
