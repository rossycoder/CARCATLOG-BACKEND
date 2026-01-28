const axios = require('axios');

async function testVehicleHistoryAPI() {
  try {
    console.log('🔍 Testing Vehicle History API...\n');
    
    const vrm = 'RJ08PFA';
    console.log(`Fetching history for: ${vrm}\n`);
    
    const response = await axios.get(`http://localhost:5000/api/vehicle-history/${vrm}`);
    
    console.log('✅ API Response received');
    console.log('Status:', response.status);
    console.log('\n📊 History Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n📝 Summary:');
      console.log(`   Owners: ${data.numberOfPreviousKeepers || data.previousOwners || 'N/A'}`);
      console.log(`   Keys: ${data.numberOfKeys || 'N/A'}`);
      console.log(`   Service History: ${data.serviceHistory || 'N/A'}`);
      console.log(`   Stolen: ${data.isStolen ? 'Yes' : 'No'}`);
      console.log(`   Written Off: ${data.isWrittenOff ? 'Yes' : 'No'}`);
    }
    
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testVehicleHistoryAPI();
