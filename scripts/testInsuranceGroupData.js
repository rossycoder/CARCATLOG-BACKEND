const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testInsuranceGroupData() {
  try {
    console.log('🔍 Testing Insurance Group Data Extraction\n');

    // Test with a known registration
    const testReg = 'MX08XMT'; // Use a test registration
    
    console.log(`Testing with registration: ${testReg}\n`);
    
    const result = await checkCarDetailsClient.getVehicleData(testReg);
    
    console.log('✅ API Response received\n');
    console.log('📊 Running Costs Data:');
    console.log('  - Insurance Group:', result.insuranceGroup);
    console.log('  - CO2 Emissions:', result.co2Emissions);
    console.log('  - Annual Tax:', result.annualTax);
    console.log('  - Fuel Economy:', result.fuelEconomy);
    
    console.log('\n📋 Full Running Costs Object:');
    console.log(JSON.stringify({
      insuranceGroup: result.insuranceGroup,
      co2Emissions: result.co2Emissions,
      annualTax: result.annualTax,
      fuelEconomy: result.fuelEconomy
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testInsuranceGroupData();
