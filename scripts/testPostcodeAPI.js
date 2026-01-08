const axios = require('axios');

async function testPostcode(postcode) {
  try {
    const normalizedPostcode = postcode.trim().replace(/\s+/g, '');
    console.log(`Testing postcode: ${postcode}`);
    console.log(`Normalized: ${normalizedPostcode}`);
    console.log(`URL: https://api.postcodes.io/postcodes/${normalizedPostcode}`);
    
    const response = await axios.get(
      `https://api.postcodes.io/postcodes/${normalizedPostcode}`,
      { timeout: 5000 }
    );

    console.log('\n✅ Success!');
    console.log('Status:', response.data.status);
    console.log('Result:', JSON.stringify(response.data.result, null, 2));
  } catch (err) {
    console.log('\n❌ Error!');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}

// Test various postcodes
async function runTests() {
  console.log('=== Testing Postcode API ===\n');
  
  // Test valid postcodes
  await testPostcode('NE1+1AA');
  console.log('\n---\n');
  
  await testPostcode('NE11AA');
  console.log('\n---\n');
  
  await testPostcode('SW1A 1AA');
  console.log('\n---\n');
  
  await testPostcode('M1 1AE');
  console.log('\n---\n');
  
  await testPostcode('EC1A 1BB');
}

runTests();
