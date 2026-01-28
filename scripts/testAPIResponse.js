require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testAPIResponse() {
  try {
    console.log('🔍 Testing API Response...\n');
    
    // Test the search API endpoint
    const response = await axios.get('http://localhost:5000/api/vehicles/search', {
      params: {
        limit: 10
      }
    });
    
    console.log('✅ API Response received');
    console.log(`📊 Total cars returned: ${response.data.total || response.data.cars?.length || 0}`);
    
    if (response.data.cars && response.data.cars.length > 0) {
      console.log('\n📝 Cars in response:');
      response.data.cars.forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.make} ${car.model} (${car.year})`);
        console.log(`      Status: ${car.advertStatus}`);
        console.log(`      Registration: ${car.registrationNumber || 'N/A'}`);
        console.log(`      Price: £${car.price}`);
      });
    } else {
      console.log('\n❌ No cars in API response');
    }
    
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPIResponse();
