/**
 * Test the API endpoint for NU10YEV history
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testAPI() {
  try {
    const vrm = 'NU10YEV';
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    
    console.log(`Testing API endpoint: ${baseURL}/api/vehicle-history/check`);
    console.log(`VRM: ${vrm}\n`);
    
    const response = await axios.post(`${baseURL}/api/vehicle-history/check`, {
      vrm: vrm,
      forceRefresh: false
    });
    
    console.log('✅ API Response received\n');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    const historyData = response.data.data;
    
    if (historyData) {
      console.log('\n📊 Key Fields:');
      console.log('  VRM:', historyData.vrm);
      console.log('  Number of Previous Keepers:', historyData.numberOfPreviousKeepers);
      console.log('  Previous Owners:', historyData.previousOwners);
      console.log('  Number of Owners:', historyData.numberOfOwners);
      console.log('  V5C Certificate Count:', historyData.v5cCertificateCount);
      console.log('  Keeper Changes List Length:', historyData.keeperChangesList?.length || 0);
      
      if (historyData.numberOfPreviousKeepers === 7) {
        console.log('\n✅ SUCCESS: API returns correct owner count (7)');
      } else {
        console.log('\n❌ ERROR: API returns incorrect owner count:', historyData.numberOfPreviousKeepers);
      }
    } else {
      console.log('\n❌ ERROR: No history data in response');
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testAPI();
