const axios = require('axios');

const BACKEND_URL = 'https://carcatlog-backend-1.onrender.com';
const FRONTEND_ORIGIN = 'https://carcatlog.vercel.app';

async function testCORS() {
  console.log('Testing CORS from Vercel frontend origin...\n');
  
  try {
    // Test with Origin header (simulating browser request from Vercel)
    console.log(`Testing request with Origin: ${FRONTEND_ORIGIN}`);
    const response = await axios.get(`${BACKEND_URL}/health`, {
      headers: {
        'Origin': FRONTEND_ORIGIN
      },
      timeout: 10000
    });
    
    console.log('\n✓ Request successful!');
    console.log('\nCORS Headers in Response:');
    console.log('  Access-Control-Allow-Origin:', response.headers['access-control-allow-origin'] || '❌ NOT SET');
    console.log('  Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials'] || '❌ NOT SET');
    console.log('  Access-Control-Allow-Methods:', response.headers['access-control-allow-methods'] || 'Not set');
    
    if (response.headers['access-control-allow-origin']) {
      console.log('\n✅ CORS is properly configured!');
    } else {
      console.log('\n❌ CORS headers missing - this will cause browser errors');
    }
    
  } catch (error) {
    console.error('❌ Request failed:');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Headers:', error.response.headers);
    }
  }
}

testCORS();
