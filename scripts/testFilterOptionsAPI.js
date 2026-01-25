const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testFilterOptionsAPI() {
  try {
    console.log('🧪 Testing Filter Options API\n');
    console.log('API URL:', API_URL);

    // Test 1: Get all filter options (no filters)
    console.log('\n📊 Test 1: Get all filter options');
    const response1 = await axios.get(`${API_URL}/api/vehicles/filter-options`);
    console.log('✅ Status:', response1.status);
    console.log('All colours:', response1.data.data.colours);

    // Test 2: Get filter options for Honda only
    console.log('\n📊 Test 2: Get filter options for HONDA');
    const response2 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA`);
    console.log('✅ Status:', response2.status);
    console.log('Honda colours:', response2.data.data.colours);
    console.log('Honda body types:', response2.data.data.bodyTypes);
    console.log('Honda transmissions:', response2.data.data.transmissions);

    // Test 3: Get filter options for Honda Civic
    console.log('\n📊 Test 3: Get filter options for HONDA CIVIC');
    const response3 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=CIVIC`);
    console.log('✅ Status:', response3.status);
    console.log('Honda Civic colours:', response3.data.data.colours);
    console.log('Honda Civic body types:', response3.data.data.bodyTypes);

    // Test 4: Get filter options for BMW
    console.log('\n📊 Test 4: Get filter options for BMW');
    const response4 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=BMW`);
    console.log('✅ Status:', response4.status);
    console.log('BMW colours:', response4.data.data.colours);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testFilterOptionsAPI();
