/**
 * Test script to diagnose trade registration 400 error
 */

const axios = require('axios');

const RENDER_URL = 'https://carcatlog-backend-1.onrender.com';

async function testTradeRegister() {
  console.log('🧪 Testing Trade Registration Endpoint\n');
  console.log('='.repeat(60));

  // Test with valid data
  const testData = {
    businessName: 'Test Motors Ltd',
    contactPerson: 'John Smith',
    email: 'test@testmotors.com',
    phone: '07123456789',
    password: 'TestPassword123',
    tradingName: 'Test Motors',
    businessRegistrationNumber: '12345678',
    vatNumber: 'GB123456789'
  };

  console.log('\n📋 Test Data:');
  console.log(JSON.stringify(testData, null, 2));

  try {
    console.log('\n🔄 Sending registration request...');
    
    const response = await axios.post(
      `${RENDER_URL}/api/trade/auth/register`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://carcatlog.vercel.app'
        }
      }
    );

    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('\n❌ ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    
    if (error.response?.data) {
      console.log('\n📦 Error Response:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      // Show validation errors if present
      if (error.response.data.errors) {
        console.log('\n⚠️  Validation Errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`   ${index + 1}. ${err}`);
        });
      }
    }

    // Test with minimal data to see what's required
    console.log('\n\n🔍 Testing with minimal data...');
    const minimalData = {
      businessName: 'Test',
      contactPerson: 'Test',
      email: 'test@test.com',
      phone: '07123456789',
      password: 'Test1234'
    };

    try {
      const minResponse = await axios.post(
        `${RENDER_URL}/api/trade/auth/register`,
        minimalData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://carcatlog.vercel.app'
          }
        }
      );
      console.log('✅ Minimal data worked!');
      console.log('Response:', minResponse.data);
    } catch (minError) {
      console.log('❌ Minimal data also failed');
      console.log('Error:', minError.response?.data);
    }
  }

  console.log('\n' + '='.repeat(60));
}

testTradeRegister()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
