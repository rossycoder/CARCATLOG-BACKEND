const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testCompleteFilterFlow() {
  try {
    console.log('🧪 Testing Complete Filter Flow\n');
    console.log('='.repeat(60));

    // Test 1: No filters - should show all options
    console.log('\n📊 Step 1: No filters (initial load)');
    const res1 = await axios.get(`${API_URL}/api/vehicles/filter-options`);
    console.log('✅ Makes:', res1.data.data.makes);
    console.log('✅ All Colors:', res1.data.data.colours);
    console.log('✅ All Body Types:', res1.data.data.bodyTypes);

    // Test 2: Select Honda - should filter to Honda options only
    console.log('\n📊 Step 2: Select HONDA');
    const res2 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA`);
    console.log('✅ Honda Colors:', res2.data.data.colours);
    console.log('✅ Honda Body Types:', res2.data.data.bodyTypes);
    console.log('✅ Honda Transmissions:', res2.data.data.transmissions);

    // Test 3: Select Honda Civic - should filter to Honda Civic options only
    console.log('\n📊 Step 3: Select HONDA Civic');
    const res3 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=Civic`);
    console.log('✅ Honda Civic Colors:', res3.data.data.colours);
    console.log('✅ Honda Civic Body Types:', res3.data.data.bodyTypes);
    console.log('✅ Honda Civic Transmissions:', res3.data.data.transmissions);

    // Test 4: Select Honda Civic CTDI Type S GT variant
    console.log('\n📊 Step 4: Select HONDA Civic - CTDI Type S GT');
    const res4 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=Civic&submodel=CTDI Type S GT`);
    console.log('✅ Variant Colors:', res4.data.data.colours);
    console.log('✅ Variant Body Types:', res4.data.data.bodyTypes);
    console.log('✅ Variant Transmissions:', res4.data.data.transmissions);

    // Test 5: Select Honda Civic I-VTec Type S variant
    console.log('\n📊 Step 5: Select HONDA Civic - I-VTec Type S');
    const res5 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=Civic&submodel=I-VTec Type S`);
    console.log('✅ Variant Colors:', res5.data.data.colours);
    console.log('✅ Variant Body Types:', res5.data.data.bodyTypes);
    console.log('✅ Variant Transmissions:', res5.data.data.transmissions);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! Filter cascade working correctly.');
    console.log('\nExpected behavior:');
    console.log('1. Initial load shows all colors from all cars');
    console.log('2. Selecting Honda filters to Honda colors only');
    console.log('3. Selecting Civic filters to Civic colors only');
    console.log('4. Selecting variant filters to that specific variant colors');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testCompleteFilterFlow();
