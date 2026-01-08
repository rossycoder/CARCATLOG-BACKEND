/**
 * Test the filter options endpoint
 */

require('dotenv').config();
const axios = require('axios');

async function testFilterEndpoint() {
  try {
    console.log('Testing filter options endpoint...');
    console.log('URL: http://localhost:5000/api/vehicles/filter-options\n');
    
    const response = await axios.get('http://localhost:5000/api/vehicles/filter-options');
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    const { data } = response.data;
    console.log('\n--- Summary ---');
    console.log(`Makes: ${data.makes.length}`);
    console.log(`Models: ${data.models.length}`);
    console.log(`Colors: ${data.colours.length}`);
    console.log(`Fuel Types: ${data.fuelTypes.length}`);
    console.log(`Transmissions: ${data.transmissions.length}`);
    console.log(`Body Types: ${data.bodyTypes.length}`);
    console.log(`Year Range: ${data.yearRange.min} - ${data.yearRange.max}`);
    
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Make sure to start the server with: npm start');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testFilterEndpoint();
