/**
 * Test CheckCarDetails API directly
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testCheckCarDetailsAPI() {
  console.log('🧪 Testing CheckCarDetails API...\n');
  
  const registration = 'HUM777A';
  
  console.log(`📋 Configuration:`);
  console.log(`   Base URL: ${process.env.CHECKCARD_API_BASE_URL}`);
  console.log(`   API Environment: ${process.env.API_ENVIRONMENT}`);
  console.log(`   API Key: ${process.env.CHECKCARD_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`   Test Key: ${process.env.CHECKCARD_API_TEST_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`\n🚗 Testing with registration: ${registration}\n`);
  
  try {
    const data = await CheckCarDetailsClient.getVehicleData(registration);
    console.log('✅ SUCCESS! Data received:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

testCheckCarDetailsAPI();
