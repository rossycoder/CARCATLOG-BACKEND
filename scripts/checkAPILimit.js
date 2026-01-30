require('dotenv').config();
const axios = require('axios');

async function checkAPILimit() {
  try {
    const apiKey = process.env.CHECKCARD_API_KEY;
    const baseUrl = process.env.CHECKCARD_API_BASE_URL;
    
    // Try with a test VRM that contains 'A' (for test mode)
    const testVRM = 'AB12CDE'; // Contains 'A' for test mode
    
    console.log('=== Checking API Status ===');
    console.log('API Key:', apiKey.substring(0, 8) + '...');
    console.log('Base URL:', baseUrl);
    console.log('Test VRM:', testVRM);
    console.log();
    
    const url = `${baseUrl}/vehicledata/carhistorycheck?apikey=${apiKey}&vrm=${testVRM}`;
    
    console.log('Calling API...');
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 403) {
      console.log('\n❌ API DAILY LIMIT EXCEEDED!');
      console.log('⏰ Wait 24 hours or contact support to increase limit');
      console.log('📧 Support: https://api.checkcardetails.co.uk/support');
      console.log('\n🔧 TEMPORARY SOLUTION:');
      console.log('   Cars will be saved WITHOUT automatic history check');
      console.log('   You can manually add history data later');
      return false;
    } else if (response.status === 200) {
      console.log('\n✅ API is working!');
      console.log('   New cars will get automatic history checks');
      return true;
    } else {
      console.log('\n⚠️  Unexpected API response');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ API Error:', error.message);
    return false;
  }
}

checkAPILimit();
