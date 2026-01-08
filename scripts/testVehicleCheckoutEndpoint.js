const axios = require('axios');

async function testVehicleCheckoutEndpoint() {
  const baseUrl = 'https://carcatlog-backend-1.onrender.com';
  
  console.log('🧪 Testing vehicle checkout endpoint...\n');
  
  // Test data that matches what the frontend sends
  const testData = {
    vrm: 'ABC123',
    customerEmail: 'test@example.com'
  };
  
  console.log('📤 Sending to /api/payments/create-checkout-session:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');
  
  try {
    const response = await axios.post(
      `${baseUrl}/api/payments/create-checkout-session`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 400) {
      console.log('\n🔍 Analysis:');
      console.log('The endpoint exists but rejected the request.');
      console.log('Error message:', error.response?.data?.error);
      
      if (error.response?.data?.error === 'VRM is required') {
        console.log('✅ This is the CORRECT error - backend is working!');
        console.log('The issue is that VRM is not being sent properly from frontend.');
      } else if (error.response?.data?.error === 'Package details are required') {
        console.log('❌ WRONG ENDPOINT - This is the advertising package endpoint!');
        console.log('The route is mapped incorrectly.');
      }
    } else if (error.response?.status === 404) {
      console.log('\n❌ Endpoint not found!');
      console.log('The deployment has not been updated.');
    } else if (error.response?.status === 500) {
      console.log('\n⚠️  Server error - check backend logs');
    }
  }
}

testVehicleCheckoutEndpoint();
