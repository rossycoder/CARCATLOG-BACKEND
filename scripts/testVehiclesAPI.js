/**
 * Test the vehicles API endpoint with advertId
 */

const axios = require('axios');

async function testVehiclesAPI() {
  try {
    const advertId = '2609a53b-ea30-474c-85e0-6a25c5ede19d';
    const url = `http://localhost:5000/api/vehicles/${advertId}`;
    
    console.log(`🧪 Testing vehicles API: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('✅ API Response Status:', response.status);
    console.log('📋 Vehicle Data:');
    console.log('   Make/Model:', response.data.data.make, response.data.data.model);
    console.log('   Registration:', response.data.data.registrationNumber);
    console.log('   Status:', response.data.data.advertStatus);
    console.log('   Running Costs:', response.data.data.runningCosts);
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
  }
}

testVehiclesAPI();