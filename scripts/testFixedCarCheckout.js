const axios = require('axios');

async function testFixedCarCheckout() {
  const baseUrl = 'https://carcatlog-backend-1.onrender.com';
  
  console.log('🧪 Testing FIXED car checkout with vehicleValue included...\n');
  
  // Test data that NOW includes vehicleValue
  const testData = {
    packageId: 'bronze',
    packageName: 'Bronze',
    price: 799, // in pence (£7.99)
    priceExVat: 799,
    vatAmount: 0,
    duration: '3 weeks',
    durationDays: 21,
    advertId: 'test-advert-456',
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
    vehicleValue: 'under-1000', // ← THIS WAS MISSING BEFORE!
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
    console.log('📥 Response:');
    console.log('  Session ID:', response.data.data.sessionId);
    console.log('  Custom Session ID:', response.data.data.customSessionId);
    console.log('  Amount:', `£${(response.data.data.amount / 100).toFixed(2)}`);
    console.log('  Stripe URL:', response.data.data.url.substring(0, 80) + '...');
    console.log('\n🎉 The fix works! Users can now proceed to payment.');
    
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 400) {
      console.log('\n⚠️  Still failing! Check the error message above.');
    }
  }
}

testFixedCarCheckout();
