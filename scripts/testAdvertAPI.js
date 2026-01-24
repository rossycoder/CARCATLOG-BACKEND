const axios = require('axios');

async function testAdvertAPI() {
  try {
    const advertId = 'a1fe37e7-cd58-4584-89c8-200904318c7a';
    const url = `http://localhost:5000/api/adverts/${advertId}`;
    
    console.log('📡 Fetching from:', url);
    
    const response = await axios.get(url);
    
    console.log('\n✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAdvertAPI();
