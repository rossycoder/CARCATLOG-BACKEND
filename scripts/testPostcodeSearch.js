const axios = require('axios');

async function testPostcodeSearch() {
  try {
    console.log('🔍 Testing Postcode Search API...\n');
    
    // Test with the car's postcode
    const postcode = 'L1 1AA';
    const radius = 50;
    
    console.log(`Searching for cars near ${postcode} within ${radius} miles...\n`);
    
    const response = await axios.get('http://localhost:5000/api/postcode/search', {
      params: {
        postcode: postcode,
        radius: radius
      }
    });
    
    console.log('✅ API Response received');
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    console.log(`📊 Total cars found: ${response.data.count || response.data.data?.results?.length || 0}`);
    console.log(`📍 Search postcode: ${response.data.data?.postcode || response.data.postcode}`);
    console.log(`📏 Search radius: ${response.data.data?.radius || response.data.radius} miles\n`);
    
    const results = response.data.data?.results || response.data.results || [];
    
    if (results.length > 0) {
      console.log('📝 Cars found:');
      results.forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.make} ${car.model} (${car.year})`);
        console.log(`      Status: ${car.advertStatus}`);
        console.log(`      Registration: ${car.registrationNumber || 'N/A'}`);
        console.log(`      Price: £${car.price}`);
        console.log(`      Distance: ${car.distance?.toFixed(1) || 'N/A'} miles`);
        console.log(`      Postcode: ${car.postcode || 'N/A'}`);
      });
    } else {
      console.log('❌ No cars found in search results');
    }
    
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPostcodeSearch();
