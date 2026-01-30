/**
 * Test MOT History API
 * Tests if MOT history is being fetched correctly
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testMOTHistory() {
  const registration = 'CX18NBG'; // Test with your registration
  
  console.log('='.repeat(60));
  console.log('Testing MOT History API');
  console.log('='.repeat(60));
  console.log(`Registration: ${registration}`);
  console.log('');
  
  try {
    console.log('Fetching MOT history...');
    const motData = await CheckCarDetailsClient.getMOTHistory(registration);
    
    console.log('\n✅ MOT History Response:');
    console.log(JSON.stringify(motData, null, 2));
    
    // Check if MOT history exists
    const motHistory = motData.MotHistory || motData.motHistory || motData.MOTHistory || [];
    
    if (Array.isArray(motHistory) && motHistory.length > 0) {
      console.log(`\n✅ Found ${motHistory.length} MOT records`);
      console.log('\nFirst MOT record:');
      console.log(JSON.stringify(motHistory[0], null, 2));
    } else {
      console.log('\n⚠️ No MOT history found in response');
      console.log('Response keys:', Object.keys(motData));
    }
    
  } catch (error) {
    console.error('\n❌ Error fetching MOT history:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testMOTHistory();
