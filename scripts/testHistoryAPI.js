require('dotenv').config();
const axios = require('axios');

async function testHistoryAPI() {
  try {
    const vrm = 'RJ08PFA';
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    
    console.log('=== Testing History API Endpoint ===');
    console.log(`VRM: ${vrm}`);
    console.log(`Base URL: ${baseURL}\n`);
    
    // Test GET endpoint
    console.log('1. Testing GET /api/vehicle-history/:vrm');
    try {
      const getResponse = await axios.get(`${baseURL}/api/vehicle-history/${vrm}`);
      console.log('✅ GET Success');
      console.log('Response data:', JSON.stringify(getResponse.data, null, 2));
      
      if (getResponse.data.data) {
        const history = getResponse.data.data;
        console.log('\n=== Owner Data ===');
        console.log('numberOfPreviousKeepers:', history.numberOfPreviousKeepers);
        console.log('previousOwners:', history.previousOwners);
        console.log('numberOfOwners:', history.numberOfOwners);
      }
    } catch (error) {
      console.log('❌ GET Failed:', error.response?.status, error.response?.data || error.message);
    }
    
    console.log('\n2. Testing POST /api/vehicle-history/check');
    try {
      const postResponse = await axios.post(`${baseURL}/api/vehicle-history/check`, {
        vrm: vrm,
        forceRefresh: false
      });
      console.log('✅ POST Success');
      console.log('Response data:', JSON.stringify(postResponse.data, null, 2));
      
      if (postResponse.data.data) {
        const history = postResponse.data.data;
        console.log('\n=== Owner Data ===');
        console.log('numberOfPreviousKeepers:', history.numberOfPreviousKeepers);
        console.log('previousOwners:', history.previousOwners);
        console.log('numberOfOwners:', history.numberOfOwners);
      }
    } catch (error) {
      console.log('❌ POST Failed:', error.response?.status, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testHistoryAPI();
