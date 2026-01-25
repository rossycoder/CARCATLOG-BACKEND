/**
 * Diagnose History API Error
 * Tests the complete flow to find where the error occurs
 */

const axios = require('axios');

async function testHistoryEndpoint() {
  console.log('🔍 Diagnosing History API Error\n');
  console.log('='.repeat(80));
  
  const testVRM = 'EX09MYY';
  
  try {
    console.log(`\n📡 Testing POST /api/vehicle-history/check with VRM: ${testVRM}`);
    console.log('URL: http://localhost:5000/api/vehicle-history/check');
    console.log('Body:', JSON.stringify({ vrm: testVRM, forceRefresh: true }, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/vehicle-history/check', {
      vrm: testVRM,
      forceRefresh: true
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR CAUGHT!');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('\nError Response Data:');
    console.log(JSON.stringify(error.response?.data, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ERROR DETAILS:');
    console.log('='.repeat(80));
    
    if (error.response?.data?.error) {
      console.log('Error Message:', error.response.data.error);
    }
    
    if (error.response?.data?.message) {
      console.log('Detailed Message:', error.response.data.message);
    }
    
    if (error.response?.data?.stack) {
      console.log('\nStack Trace:');
      console.log(error.response.data.stack);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 TROUBLESHOOTING STEPS:');
    console.log('='.repeat(80));
    console.log('1. Check if backend server is running on port 5000');
    console.log('2. Check backend terminal for error logs');
    console.log('3. Verify parser fix is loaded (backend restart required)');
    console.log('4. Check if API credentials are valid in backend/.env');
    console.log('5. Test parser directly: node backend/scripts/testParserFix.js');
  }
}

// Run the test
testHistoryEndpoint();
