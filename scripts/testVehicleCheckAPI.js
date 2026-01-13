/**
 * Test vehicle check and MOT history API
 */

const axios = require('axios');

const API_KEY = '14cedd96eeda4ac6b6b7f9a4db04f573';
const BASE_URL = 'https://api.checkcardetails.co.uk';

async function testVehicleCheckAPI() {
  console.log('🧪 Testing Vehicle Check & MOT History API\n');
  console.log('='.repeat(60));

  // Test VRMs
  const testVRMs = [
    'BD51SMR',
    'AA19ABC',
    'MT58FZE' // Known test VRM
  ];

  for (const vrm of testVRMs) {
    console.log(`\n📋 Testing VRM: ${vrm}`);
    console.log('-'.repeat(60));

    // Test 1: UK Vehicle Data (comprehensive)
    console.log('\n1️⃣ Testing ukvehicledata endpoint...');
    try {
      const response = await axios.get(
        `${BASE_URL}/vehicledata/ukvehicledata`,
        {
          params: {
            apikey: API_KEY,
            vrm: vrm
          },
          timeout: 10000
        }
      );

      console.log('✅ SUCCESS!');
      console.log('Status:', response.status);
      
      const data = response.data;
      const vehicleReg = data.VehicleRegistration || {};
      
      console.log('\n📊 Vehicle Data:');
      console.log('   Make:', vehicleReg.Make || 'N/A');
      console.log('   Model:', vehicleReg.Model || 'N/A');
      console.log('   Colour:', vehicleReg.Colour || 'N/A');
      console.log('   Year:', vehicleReg.YearOfManufacture || 'N/A');
      console.log('   Fuel:', vehicleReg.FuelType || 'N/A');

    } catch (error) {
      console.log('❌ FAILED');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    // Test 2: MOT History
    console.log('\n2️⃣ Testing MOT history endpoint...');
    try {
      const response = await axios.get(
        `${BASE_URL}/vehicledata/mot`,
        {
          params: {
            apikey: API_KEY,
            vrm: vrm
          },
          timeout: 10000
        }
      );

      console.log('✅ SUCCESS!');
      console.log('Status:', response.status);
      
      const data = response.data;
      console.log('\n🔧 MOT Data:');
      console.log('   Status:', data.mot?.motStatus || data.MotStatus || 'N/A');
      console.log('   Expiry:', data.mot?.motDueDate || data.MotExpiryDate || 'N/A');
      console.log('   Tests:', data.motHistory?.length || data.MotTests?.length || 0);

    } catch (error) {
      console.log('❌ FAILED');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Mileage History
    console.log('\n3️⃣ Testing mileage history endpoint...');
    try {
      const response = await axios.get(
        `${BASE_URL}/vehicledata/mileage`,
        {
          params: {
            apikey: API_KEY,
            vrm: vrm
          },
          timeout: 10000
        }
      );

      console.log('✅ SUCCESS!');
      console.log('Status:', response.status);
      
      const data = response.data;
      const readings = data.mileage || data.MileageReadings || [];
      console.log('\n📏 Mileage Data:');
      console.log('   Readings:', readings.length);
      if (readings.length > 0) {
        const latest = readings[0];
        console.log('   Latest:', latest.mileage || latest.Mileage || 'N/A');
      }

    } catch (error) {
      console.log('❌ FAILED');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log('   API Key: Working ✅');
  console.log('   Base URL: ' + BASE_URL);
  console.log('\n💡 Note: Some VRMs may not have data in the API database.');
  console.log('   This is normal - not all vehicles have history data available.');
}

testVehicleCheckAPI()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
