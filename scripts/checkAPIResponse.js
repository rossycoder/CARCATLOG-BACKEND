require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkAPIResponse() {
  try {
    const registration = 'EX09MYY';
    
    console.log(`\n🔍 Checking API response for: ${registration}\n`);
    
    const apiData = await CheckCarDetailsClient.getVehicleData(registration);
    
    console.log('\n📋 Full API Response:');
    console.log(JSON.stringify(apiData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAPIResponse();
