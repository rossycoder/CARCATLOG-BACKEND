const axios = require('axios');

async function testFilterOptions() {
  try {
    console.log('Testing filter options API...\n');
    
    const response = await axios.get('http://localhost:5000/api/vehicles/filter-options');
    
    console.log('Status:', response.status);
    console.log('\nColors returned by API:');
    console.log(response.data.data.colours);
    
    console.log('\nAll filter options:');
    console.log(JSON.stringify(response.data.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testFilterOptions();
