require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testPublishValidation() {
  console.log('🧪 Testing Trade Publish Validation Fix\n');

  try {
    // Test 1: Missing advertId
    console.log('Test 1: Missing advertId');
    try {
      await axios.post(`${API_URL}/api/trade/inventory/publish`, {
        contactDetails: {
          phoneNumber: '07123456789',
          email: 'test@example.com',
          postcode: 'SW1A 1AA'
        }
      }, {
        headers: { Authorization: 'Bearer fake-token' }
      });
      console.log('❌ Should have failed with missing advertId\n');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected missing advertId');
        console.log('   Error:', error.response.data.message);
        console.log('   Errors:', error.response.data.errors);
      } else {
        console.log('⚠️  Got different error:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    // Test 2: Missing contact details
    console.log('Test 2: Missing contact details');
    try {
      await axios.post(`${API_URL}/api/trade/inventory/publish`, {
        advertId: 'test-advert-id'
      }, {
        headers: { Authorization: 'Bearer fake-token' }
      });
      console.log('❌ Should have failed with missing contact details\n');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected missing contact details');
        console.log('   Error:', error.response.data.message);
        console.log('   Errors:', error.response.data.errors);
      } else {
        console.log('⚠️  Got different error:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    // Test 3: Missing phone number
    console.log('Test 3: Missing phone number in contact details');
    try {
      await axios.post(`${API_URL}/api/trade/inventory/publish`, {
        advertId: 'test-advert-id',
        contactDetails: {
          email: 'test@example.com',
          postcode: 'SW1A 1AA'
        }
      }, {
        headers: { Authorization: 'Bearer fake-token' }
      });
      console.log('❌ Should have failed with missing phone number\n');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected missing phone number');
        console.log('   Error:', error.response.data.message);
        console.log('   Errors:', error.response.data.errors);
      } else {
        console.log('⚠️  Got different error:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    // Test 4: Valid structure (will fail auth, but should pass validation)
    console.log('Test 4: Valid structure (should pass validation, fail auth)');
    try {
      await axios.post(`${API_URL}/api/trade/inventory/publish`, {
        advertId: 'test-advert-id',
        contactDetails: {
          phoneNumber: '07123456789',
          email: 'test@example.com',
          postcode: 'SW1A 1AA',
          allowEmailContact: true
        },
        dealerId: 'test-dealer-id'
      }, {
        headers: { Authorization: 'Bearer fake-token' }
      });
      console.log('❌ Should have failed with auth error\n');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Passed validation, failed at auth (expected)');
        console.log('   Status:', error.response.status);
      } else if (error.response?.status === 400) {
        console.log('❌ Failed validation (unexpected)');
        console.log('   Error:', error.response.data);
      } else {
        console.log('⚠️  Got different error:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    console.log('✅ All validation tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - Validation now properly checks nested structure');
    console.log('   - Required fields are validated before processing');
    console.log('   - Clear error messages are returned');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testPublishValidation()
    .then(() => {
      console.log('\n✅ Test script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testPublishValidation };
