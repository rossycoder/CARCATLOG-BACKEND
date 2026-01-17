require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testRealLogoUpload() {
  try {
    const API_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
    
    console.log('🧪 Testing Real Logo Upload Flow\n');
    console.log(`API URL: ${API_URL}/trade/auth/register\n`);

    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Create FormData
    const formData = new FormData();
    formData.append('businessName', 'Real Test Company ' + Date.now());
    formData.append('tradingName', 'Real Test Trading');
    formData.append('contactPerson', 'Real Tester');
    formData.append('email', `realtest${Date.now()}@test.com`);
    formData.append('phone', '07123456789');
    formData.append('password', 'Test1234');
    formData.append('businessAddress', '123 Test Street');
    formData.append('businessRegistrationNumber', 'TEST123');
    formData.append('vatNumber', 'GB123456789');
    
    // Append the logo file
    formData.append('logo', testImageBuffer, {
      filename: 'test-logo.png',
      contentType: 'image/png'
    });

    console.log('📤 Sending registration request with logo...\n');
    console.log('FormData fields:');
    console.log('  - businessName: Real Test Company');
    console.log('  - logo: test-logo.png (image/png)\n');

    // Send request
    const response = await axios.post(
      `${API_URL}/trade/auth/register`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ Registration Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.dealer && response.data.dealer.logo) {
      console.log('\n✅ SUCCESS! Logo was uploaded:');
      console.log(`   ${response.data.dealer.logo}`);
    } else {
      console.log('\n❌ FAILED! Logo is null in response');
      console.log('   This means the backend did not receive or process the logo file');
    }

  } catch (error) {
    console.error('❌ Error during test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testRealLogoUpload();
