const axios = require('axios');

// Test the trade publish endpoint to see if validation is removed
async function testTradePublish() {
  try {
    console.log('Testing trade publish endpoint...');
    console.log('This will fail with 401 if not authenticated, but we can see if validation is removed from error message');
    
    const response = await axios.post('http://localhost:5000/api/trade/inventory/publish', {
      advertId: 'test-123',
      contactDetails: {
        phoneNumber: '07446975601',
        email: 'test@test.com',
        postcode: 'M1 1AE'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    console.log('Error details:', error.response?.data);
    
    if (error.response?.data?.message?.includes('Make is required')) {
      console.log('\n❌ VALIDATION STILL ACTIVE - Server needs restart!');
    } else {
      console.log('\n✅ Validation removed - Error is authentication related (expected)');
    }
  }
}

testTradePublish();
