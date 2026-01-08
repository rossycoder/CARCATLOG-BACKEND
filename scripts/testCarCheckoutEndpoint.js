const axios = require('axios');

async function testCarCheckoutEndpoint() {
  const baseUrl = 'https://carcatlog-backend-1.onrender.com';
  
  console.log('🧪 Testing car checkout endpoint (the one that\'s failing)...\n');
  
  // Test data that matches EXACTLY what the frontend sends
  const testData = {
    packageId: 'bronze',
    packageName: 'Bronze',
    price: 799, // in pence (£7.99)
    priceExVat: 799,
    vatAmount: 0,
    duration: '3 weeks',
    durationDays: 21,
    advertId: 'test-advert-123',
    advertData: {
      price: 500,
      description: 'Test car',
      photos: []
    },
    vehicleData: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      registrationNumber: 'ABC123',
      mileage: 50000
    },
    contactDetails: {
      phoneNumber: '1234567890',
      email: 'test@example.com',
      postcode: 'SW1A 1AA',
      allowEmailContact: true
    },
    vehicleType: 'car',
    sellerType: 'private'
  };
  
  console.log('📤 Sending to /api/payments/create-car-checkout-session:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');
  
  try {
    const response = await axios.post(
      `${baseUrl}/api/payments/create-car-checkout-session`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 The endpoint is working! The issue must be with the frontend data.');
    
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.error;
      console.log('\n🔍 Analysis:');
      console.log('Error message:', errorMsg);
      
      if (errorMsg === 'Package details are required') {
        console.log('\n❌ VALIDATION FAILED!');
        console.log('The backend is not receiving packageId, packageName, or price.');
        console.log('This means either:');
        console.log('1. The deployment is not updated');
        console.log('2. There\'s a middleware issue stripping the body');
        console.log('3. The route is mapped to the wrong function');
      }
    }
  }
}

testCarCheckoutEndpoint();
