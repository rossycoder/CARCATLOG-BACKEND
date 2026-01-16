const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

async function testInsuranceGroupRaw() {
  try {
    console.log('🔍 Testing Raw API Response for Insurance Group\n');

    const testReg = 'MX08XMT';
    const apiKey = process.env.CHECKCARDETAILS_API_KEY;
    
    console.log(`Testing with registration: ${testReg}\n`);
    
    // Test both endpoints
    const endpoints = [
      `https://api.checkcardetails.co.uk/vehicledata/Vehiclespecs?vrm=${testReg}`,
      `https://api.checkcardetails.co.uk/vehicledata/ukvehicledata?vrm=${testReg}`
    ];
    
    for (const url of endpoints) {
      console.log(`\n📡 Calling: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      const data = response.data;
      
      console.log('\n🔍 Searching for Insurance Group in response...');
      
      // Search for insurance-related fields
      const searchForInsurance = (obj, prefix = '') => {
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (key.toLowerCase().includes('insurance')) {
            console.log(`  ✅ Found: ${fullKey} = ${JSON.stringify(obj[key])}`);
          }
          
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            searchForInsurance(obj[key], fullKey);
          }
        }
      };
      
      searchForInsurance(data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testInsuranceGroupRaw();
