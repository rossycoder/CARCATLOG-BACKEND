require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testRegistrationWithLogo() {
  try {
    console.log('Testing trade dealer registration with logo upload...\n');

    // Create a minimal test image (1x1 PNG)
    const minimalPNG = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);

    // Create form data
    const formData = new FormData();
    formData.append('businessName', 'Test Logo Upload Company');
    formData.append('tradingName', 'Test Logo');
    formData.append('contactPerson', 'Test Person');
    formData.append('email', `test-logo-${Date.now()}@example.com`);
    formData.append('phone', '07123456789');
    formData.append('password', 'TestPass123');
    formData.append('businessAddress', '123 Test Street, London');
    formData.append('businessRegistrationNumber', 'TEST123');
    formData.append('vatNumber', 'GB123456789');
    
    // Append the logo file
    formData.append('logo', minimalPNG, {
      filename: 'test-logo.png',
      contentType: 'image/png'
    });

    console.log('Sending registration request with logo...');
    
    const response = await axios.post(
      'http://localhost:5000/api/trade/auth/register',
      formData,
      {
        headers: formData.getHeaders(),
        validateStatus: () => true // Accept any status code
      }
    );

    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    
    if (response.data.dealer) {
      console.log('\n=== Dealer Info ===');
      console.log('ID:', response.data.dealer.id);
      console.log('Business Name:', response.data.dealer.businessName);
      console.log('Email:', response.data.dealer.email);
      console.log('Logo:', response.data.dealer.logo);
      console.log('Status:', response.data.dealer.status);
      
      if (response.data.dealer.logo) {
        console.log('\n✅ Logo was uploaded successfully!');
        console.log('Logo URL:', response.data.dealer.logo);
      } else {
        console.log('\n❌ Logo is null - upload failed!');
      }
    }

    if (!response.data.success) {
      console.log('\n❌ Registration failed');
      console.log('Error:', response.data.message);
    }

  } catch (error) {
    console.error('Test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRegistrationWithLogo();
