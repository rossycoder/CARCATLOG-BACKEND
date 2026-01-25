const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testFilterAPI() {
  try {
    console.log('🧪 Testing Filter Options API - Detailed\n');

    // Test 1: All colors
    console.log('📊 Test 1: All colors (no filter)');
    const res1 = await axios.get(`${API_URL}/api/vehicles/filter-options`);
    console.log('All colors:', JSON.stringify(res1.data.data.colours));

    // Test 2: Honda colors
    console.log('\n📊 Test 2: Honda colors');
    const res2 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA`);
    console.log('Honda colors:', JSON.stringify(res2.data.data.colours));

    // Test 3: BMW colors
    console.log('\n📊 Test 3: BMW colors');
    const res3 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=BMW`);
    console.log('BMW colors:', JSON.stringify(res3.data.data.colours));

    // Test 4: SKODA colors
    console.log('\n📊 Test 4: SKODA colors');
    const res4 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=SKODA`);
    console.log('SKODA colors:', JSON.stringify(res4.data.data.colours));

    // Test 5: Honda Civic colors
    console.log('\n📊 Test 5: Honda Civic colors');
    const res5 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=Civic`);
    console.log('Honda Civic colors:', JSON.stringify(res5.data.data.colours));

    console.log('\n✅ Tests complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testFilterAPI();
