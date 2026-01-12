/**
 * Test script to diagnose the 403 error on Render deployment
 */

const axios = require('axios');

const RENDER_URL = 'https://carcatlog-backend-1.onrender.com';

async function testRenderLogin() {
  console.log('🧪 Testing Render Backend Login\n');
  console.log('='.repeat(60));

  // Test 1: Health check
  console.log('\n1️⃣ Testing health endpoint...');
  try {
    const healthResponse = await axios.get(`${RENDER_URL}/health`);
    console.log('✅ Health check passed');
    console.log('   Status:', healthResponse.data.status);
    console.log('   Database:', healthResponse.data.database?.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: CORS preflight
  console.log('\n2️⃣ Testing CORS preflight...');
  try {
    const corsResponse = await axios.options(`${RENDER_URL}/api/trade/auth/login`, {
      headers: {
        'Origin': 'https://carcatlog.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log('✅ CORS preflight passed');
    console.log('   Status:', corsResponse.status);
  } catch (error) {
    console.log('❌ CORS preflight failed');
    console.log('   Status:', error.response?.status);
    console.log('   Headers:', error.response?.headers);
  }

  // Test 3: Login attempt
  console.log('\n3️⃣ Testing login endpoint...');
  try {
    const loginResponse = await axios.post(
      `${RENDER_URL}/api/trade/auth/login`,
      {
        email: 'test@example.com',
        password: 'TestPassword123'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://carcatlog.vercel.app'
        }
      }
    );
    console.log('✅ Login request accepted');
    console.log('   Status:', loginResponse.status);
    console.log('   Response:', loginResponse.data);
  } catch (error) {
    console.log('❌ Login request failed');
    console.log('   Status:', error.response?.status);
    console.log('   Status Text:', error.response?.statusText);
    console.log('   Error:', error.response?.data);
    console.log('   Headers:', error.response?.headers);
    
    // Check if it's a CORS issue
    if (error.response?.status === 403) {
      console.log('\n⚠️  403 Forbidden Error Detected');
      console.log('   Possible causes:');
      console.log('   - CORS configuration issue');
      console.log('   - Rate limiting triggered');
      console.log('   - Input validation blocking request');
      console.log('   - Security middleware blocking request');
    }
  }

  // Test 4: Check with different origin
  console.log('\n4️⃣ Testing with localhost origin...');
  try {
    const loginResponse = await axios.post(
      `${RENDER_URL}/api/trade/auth/login`,
      {
        email: 'test@example.com',
        password: 'TestPassword123'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      }
    );
    console.log('✅ Login with localhost origin accepted');
    console.log('   Status:', loginResponse.status);
  } catch (error) {
    console.log('❌ Login with localhost origin failed');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.message || error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log('   If all tests fail with 403, check:');
  console.log('   1. CORS configuration in server.js');
  console.log('   2. Rate limiting middleware');
  console.log('   3. Input validation middleware');
  console.log('   4. Render environment variables');
}

testRenderLogin()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
