/**
 * Test Render Backend Connectivity and Data
 */

const axios = require('axios');

const BACKEND_URL = 'https://carcatlog-backend-1.onrender.com';

async function testBackend() {
  console.log('=== Testing Render Backend ===\n');
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  // Test 1: Health Check
  console.log('1️⃣  Testing Health Check...');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health Check:', response.data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  // Test 2: Root Endpoint
  console.log('\n2️⃣  Testing Root Endpoint...');
  try {
    const response = await axios.get(`${BACKEND_URL}/`);
    console.log('✅ Root Endpoint:', response.data);
  } catch (error) {
    console.log('❌ Root Endpoint Failed:', error.message);
  }

  // Test 3: Vehicle Count
  console.log('\n3️⃣  Testing Vehicle Count API...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/vehicles/count`);
    console.log('✅ Vehicle Count:', response.data);
    
    if (response.data.count === 0) {
      console.log('⚠️  WARNING: No cars found! Either:');
      console.log('   - Cars are in draft status (set SHOW_DRAFT_CARS=true on Render)');
      console.log('   - No cars in database');
      console.log('   - Database connection issue');
    }
  } catch (error) {
    console.log('❌ Vehicle Count Failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }

  // Test 4: Search Vehicles
  console.log('\n4️⃣  Testing Vehicle Search...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/vehicles/search`, {
      params: {
        postcode: 'L1 1AA',
        radius: 50
      }
    });
    console.log('✅ Search Results:', {
      success: response.data.success,
      count: response.data.vehicles?.length || 0,
      vehicles: response.data.vehicles?.map(v => ({
        id: v._id,
        make: v.make,
        model: v.model,
        status: v.advertStatus,
        postcode: v.postcode
      }))
    });
  } catch (error) {
    console.log('❌ Search Failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }

  // Test 5: Test Login Endpoint (without credentials)
  console.log('\n5️⃣  Testing Login Endpoint Structure...');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'test@test.com',
      password: 'test123'
    });
    console.log('✅ Login Response:', response.data);
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 401) {
      console.log('✅ Login Endpoint Working (returned expected error)');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.error || error.response.data.message);
    } else {
      console.log('❌ Login Endpoint Failed:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }

  // Test 6: CORS Headers
  console.log('\n6️⃣  Testing CORS Headers...');
  try {
    const response = await axios.options(`${BACKEND_URL}/api/vehicles/count`, {
      headers: {
        'Origin': 'https://carcatlog.vercel.app',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ CORS Headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
      'access-control-allow-methods': response.headers['access-control-allow-methods']
    });
  } catch (error) {
    console.log('⚠️  CORS Preflight:', error.message);
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log('✅ If all tests passed, your backend is working correctly');
  console.log('❌ If tests failed, check:');
  console.log('   1. Render service is running (check Render dashboard)');
  console.log('   2. Environment variables are set on Render');
  console.log('   3. MongoDB Atlas allows connections from 0.0.0.0/0');
  console.log('   4. Cars are activated (not in draft status)');
  console.log('\n📝 Next Steps:');
  console.log('   1. If vehicle count is 0, run: node backend/scripts/activateAllDraftCars.js');
  console.log('   2. Set SHOW_DRAFT_CARS=true on Render environment variables');
  console.log('   3. Redeploy backend on Render');
  console.log('   4. Test frontend on Vercel');
}

testBackend().catch(console.error);
