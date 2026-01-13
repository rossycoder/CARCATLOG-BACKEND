#!/usr/bin/env node
/**
 * Test if subscription routes are accessible
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'https://carcatlog-backend-1.onrender.com';

async function testRoutes() {
  console.log('🧪 Testing Trade Subscription Routes');
  console.log('=====================================\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('');

  // Test 1: Get plans (public route)
  console.log('Test 1: GET /api/trade/subscriptions/plans (public)');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/trade/subscriptions/plans`);
    console.log('✅ Status:', response.status);
    console.log('✅ Plans found:', response.data.plans?.length || 0);
  } catch (error) {
    console.log('❌ Error:', error.response?.status || error.message);
    console.log('   Message:', error.response?.data?.message || error.message);
  }
  console.log('');

  // Test 2: Create checkout session (protected route - should return 401 without token)
  console.log('Test 2: POST /api/trade/subscriptions/create-checkout-session (protected)');
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/trade/subscriptions/create-checkout-session`,
      { planSlug: 'starter' }
    );
    console.log('✅ Status:', response.status);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Route exists (returns 401/403 as expected without auth)');
    } else if (error.response?.status === 404) {
      console.log('❌ Route NOT FOUND (404)');
      console.log('   This means the route is not registered!');
    } else {
      console.log('❌ Error:', error.response?.status || error.message);
    }
    console.log('   Message:', error.response?.data?.message || error.message);
  }
  console.log('');

  // Test 3: Get current subscription (protected route)
  console.log('Test 3: GET /api/trade/subscriptions/current (protected)');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/trade/subscriptions/current`);
    console.log('✅ Status:', response.status);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Route exists (returns 401/403 as expected without auth)');
    } else if (error.response?.status === 404) {
      console.log('❌ Route NOT FOUND (404)');
    } else {
      console.log('❌ Error:', error.response?.status || error.message);
    }
    console.log('   Message:', error.response?.data?.message || error.message);
  }
  console.log('');

  console.log('✅ Test completed');
}

testRoutes().catch(console.error);
