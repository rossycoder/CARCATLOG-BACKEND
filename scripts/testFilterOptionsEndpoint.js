const axios = require('axios');

// Test the filter-options endpoint
async function testFilterOptions() {
  try {
    console.log('Testing filter-options endpoint...\n');
    
    // Test production endpoint
    const prodUrl = 'https://carcatlog-backend-1.onrender.com/api/vehicles/filter-options';
    console.log(`Testing: ${prodUrl}`);
    
    const response = await axios.get(prodUrl);
    
    console.log('\n✅ Success!');
    console.log('Status:', response.status);
    console.log('\nResponse data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('\n📊 Filter Options Summary:');
      console.log(`- Makes: ${response.data.data.makes?.length || 0}`);
      console.log(`- Models: ${response.data.data.models?.length || 0}`);
      console.log(`- Fuel Types: ${response.data.data.fuelTypes?.length || 0}`);
      console.log(`- Transmissions: ${response.data.data.transmissions?.length || 0}`);
      console.log(`- Body Types: ${response.data.data.bodyTypes?.length || 0}`);
      console.log(`- Colours: ${response.data.data.colours?.length || 0}`);
      console.log(`- Year Range: ${response.data.data.yearRange?.min} - ${response.data.data.yearRange?.max}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response data:', error.response?.data);
  }
}

testFilterOptions();
