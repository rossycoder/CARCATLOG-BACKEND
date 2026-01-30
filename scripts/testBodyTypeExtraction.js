/**
 * Test script to check body type extraction from API
 */

require('dotenv').config();
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testBodyType() {
  const registration = 'RJ08PFA';
  
  console.log('🔍 Testing body type extraction for:', registration);
  console.log('='.repeat(60));
  
  try {
    // Get vehicle data
    const vehicleData = await CheckCarDetailsClient.getVehicleData(registration);
    
    console.log('\n📊 Full Vehicle Data:');
    console.log(JSON.stringify(vehicleData, null, 2));
    
    console.log('\n🚗 Body Type Information:');
    console.log('bodyType:', vehicleData.bodyType);
    console.log('bodyShape:', vehicleData.bodyShape);
    
    // Check if body type exists
    if (vehicleData.bodyType) {
      console.log('✅ Body type found:', vehicleData.bodyType);
    } else {
      console.log('❌ Body type NOT found');
      console.log('Available fields:', Object.keys(vehicleData));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testBodyType();
