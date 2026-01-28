/**
 * Test script to check Insurance Group data from CheckCarDetails API
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testInsuranceGroup() {
  try {
    // Test with a common VRM
    const testVRM = 'RJ08PFA'; // Use a known VRM
    
    console.log(`\n🔍 Testing Insurance Group data for VRM: ${testVRM}\n`);
    
    // Fetch vehicle data
    const vehicleData = await CheckCarDetailsClient.getVehicleData(testVRM);
    
    console.log('📊 Insurance Group Data:');
    console.log('  Insurance Group:', vehicleData.insuranceGroup || 'NOT AVAILABLE');
    
    console.log('\n📋 Full Vehicle Data:');
    console.log(JSON.stringify(vehicleData, null, 2));
    
    // Also test raw API response
    console.log('\n🔧 Testing raw API response...\n');
    const rawSpecs = await CheckCarDetailsClient.getVehicleSpecs(testVRM);
    
    console.log('🔍 Searching for Insurance Group in raw response...');
    const searchForInsurance = (obj, path = '') => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];
        
        if (key.toLowerCase().includes('insurance')) {
          console.log(`  Found: ${currentPath} = ${JSON.stringify(value)}`);
        }
        
        if (typeof value === 'object' && value !== null) {
          searchForInsurance(value, currentPath);
        }
      }
    };
    
    searchForInsurance(rawSpecs);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

testInsuranceGroup();
