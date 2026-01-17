require('dotenv').config();
const mongoose = require('mongoose');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function testLogoUpload() {
  try {
    console.log('🧪 Testing logo upload during registration...\n');

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Create form data
    const form = new FormData();
    form.append('businessName', 'Test Logo Company');
    form.append('tradingName', 'Test Logo Trading');
    form.append('contactPerson', 'Logo Tester');
    form.append('email', `logotest${Date.now()}@test.com`);
    form.append('phone', '07123456789');
    form.append('password', 'TestPass123');
    form.append('businessAddress', 'Test Address');
    form.append('businessRegistrationNumber', 'TEST123');
    form.append('vatNumber', 'GB123456789');
    form.append('logo', testImageBuffer, {
      filename: 'test-logo.png',
      contentType: 'image/png'
    });

    console.log('📤 Sending registration request with logo...');
    
    const response = await axios.post(
      `${BACKEND_URL}/api/trade/auth/register`,
      form,
      {
        headers: {
          ...form.getHeaders()
        }
      }
    );

    console.log('\n✅ Registration Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.dealer) {
      console.log('\n📊 Dealer Logo Field:', response.data.dealer.logo);
      
      if (response.data.dealer.logo) {
        console.log('✅ Logo URL saved successfully!');
      } else {
        console.log('❌ Logo is null - upload failed');
      }
    }

    // Check database
    const TradeDealer = require('../models/TradeDealer');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const dealer = await TradeDealer.findOne({ email: response.data.dealer.email });
    console.log('\n📦 Database Record:');
    console.log('Logo field:', dealer.logo);
    
    await mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLogoUpload();
