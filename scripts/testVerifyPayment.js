/**
 * Test script to verify the verify-payment endpoint exists
 * Run: node backend/scripts/testVerifyPayment.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/trade/subscriptions';

async function testVerifyPaymentEndpoint() {
  console.log('🧪 Testing verify-payment endpoint...\n');

  try {
    // This will fail with 401 (no auth) but that's OK - we just want to confirm the endpoint exists
    const response = await axios.post(`${API_URL}/verify-payment`, {
      sessionId: 'test_session_id'
    });
    
    console.log('✅ Endpoint exists and responded');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        console.log('✅ Endpoint exists (401 Unauthorized - expected without token)');
      } else if (error.response.status === 400) {
        console.log('✅ Endpoint exists (400 Bad Request - expected with invalid session)');
      } else {
        console.log(`⚠️  Endpoint responded with status: ${error.response.status}`);
        console.log('Response:', error.response.data);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running');
      console.log('   Start it with: npm start (from backend directory)');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testVerifyPaymentEndpoint();
