const axios = require('axios');

const BACKEND_URL = 'https://carcatlog-backend-1.onrender.com';

async function checkStatus() {
  console.log('🔍 Checking Render Backend Status\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Time:', new Date().toISOString());
  console.log('─'.repeat(60));
  
  const tests = [
    { name: 'Health Check', url: '/health' },
    { name: 'Root Endpoint', url: '/' },
    { name: 'Vehicle History', url: '/api/vehicle-history/check?registration=TEST' },
    { name: 'Vehicles API', url: '/api/vehicles?page=1&limit=1' },
  ];
  
  for (const test of tests) {
    try {
      const start = Date.now();
      const response = await axios.get(`${BACKEND_URL}${test.url}`, {
        headers: { 'Origin': 'https://carcatlog.vercel.app' },
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - start;
      
      const corsOk = response.headers['access-control-allow-origin'] ? '✓' : '✗';
      console.log(`\n${test.name}:`);
      console.log(`  Status: ${response.status} (${duration}ms)`);
      console.log(`  CORS: ${corsOk} ${response.headers['access-control-allow-origin'] || 'Missing'}`);
      
    } catch (error) {
      console.log(`\n${test.name}:`);
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log('✅ All tests complete');
}

checkStatus();
