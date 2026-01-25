const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testVariantFiltering() {
  try {
    console.log('🧪 Testing Variant Filtering\n');

    // Test 1: Honda Civic with variant "CTDI Type S GT"
    console.log('📊 Test 1: Honda Civic - CTDI Type S GT');
    const res1 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=Civic&submodel=CTDI Type S GT`);
    console.log('Colors:', res1.data.data.colours);
    console.log('Body Types:', res1.data.data.bodyTypes);
    console.log('Transmissions:', res1.data.data.transmissions);

    // Test 2: Honda Civic with variant "I-VTec Type S"
    console.log('\n📊 Test 2: Honda Civic - I-VTec Type S');
    const res2 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=Civic&submodel=I-VTec Type S`);
    console.log('Colors:', res2.data.data.colours);
    console.log('Body Types:', res2.data.data.bodyTypes);
    console.log('Transmissions:', res2.data.data.transmissions);

    // Test 3: Honda Civic without variant
    console.log('\n📊 Test 3: Honda Civic (no variant)');
    const res3 = await axios.get(`${API_URL}/api/vehicles/filter-options?make=HONDA&model=Civic`);
    console.log('Colors:', res3.data.data.colours);
    console.log('Body Types:', res3.data.data.bodyTypes);
    console.log('Transmissions:', res3.data.data.transmissions);

    console.log('\n✅ Tests complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testVariantFiltering();
