/**
 * Test Full Enhanced Vehicle Data
 * Tests if MOT history and mileage history are included in enhanced data
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const EnhancedVehicleService = require('../services/enhancedVehicleService');

async function testFullEnhancedData() {
  const registration = 'CX18NBG';
  
  console.log('='.repeat(60));
  console.log('Testing Full Enhanced Vehicle Data');
  console.log('='.repeat(60));
  console.log(`Registration: ${registration}`);
  console.log('');
  
  try {
    const service = EnhancedVehicleService;
    
    console.log('Fetching enhanced vehicle data (no cache)...');
    const data = await service.getEnhancedVehicleData(registration, false);
    
    console.log('\n✅ Enhanced Data Response Keys:');
    console.log(Object.keys(data));
    
    // Check MOT history
    if (data.motHistory) {
      console.log(`\n✅ MOT History: ${data.motHistory.length} records`);
      if (data.motHistory.length > 0) {
        console.log('First MOT record:');
        console.log(JSON.stringify(data.motHistory[0], null, 2));
      }
    } else {
      console.log('\n❌ MOT History: NOT FOUND');
    }
    
    // Check mileage history
    if (data.mileageHistory) {
      console.log(`\n✅ Mileage History: ${data.mileageHistory.length} records`);
      if (data.mileageHistory.length > 0) {
        console.log('First mileage record:');
        console.log(JSON.stringify(data.mileageHistory[0], null, 2));
      }
    } else {
      console.log('\n❌ Mileage History: NOT FOUND');
    }
    
    // Check other important fields
    console.log('\n📊 Other Fields:');
    console.log('Make:', data.make);
    console.log('Model:', data.model);
    console.log('Year:', data.year);
    console.log('Previous Owners:', data.previousOwners);
    console.log('MOT Status:', data.motStatus);
    console.log('MOT Expiry:', data.motExpiry);
    
  } catch (error) {
    console.error('\n❌ Error:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFullEnhancedData();
