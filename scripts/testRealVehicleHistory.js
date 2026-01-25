/**
 * Test real vehicle history data from API
 * Check if all vehicles really have clean history or if there's variety
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

// Test with various UK registrations - mix of potentially clean and problematic vehicles
const testRegistrations = [
  'EK14TWX',  // Your test vehicle
  'BD51SMR',  // Older vehicle - more likely to have history
  'YN08XYZ',  // Random older reg
  'AB12CDE',  // Likely invalid/test
  'MX08XMT',  // Another test vehicle
];

async function testVehicleHistory() {
  console.log('Testing vehicle history data from API...\n');
  
  for (const vrm of testRegistrations) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${vrm}`);
    console.log('='.repeat(60));
    
    try {
      const response = await checkCarDetailsClient.getVehicleHistory(vrm);
      
      console.log('\n📊 RAW API RESPONSE:');
      console.log(JSON.stringify(response, null, 2));
      
      // Check specific history fields
      const vehicleHistory = response.VehicleHistory || {};
      
      console.log('\n🔍 HISTORY CHECKS:');
      console.log('- Write-off Record:', vehicleHistory.writeOffRecord ? '❌ YES' : '✅ NO');
      console.log('- Stolen Record:', vehicleHistory.stolenRecord ? '❌ YES' : '✅ NO');
      console.log('- Finance Record:', vehicleHistory.financeRecord ? '❌ YES' : '✅ NO');
      console.log('- Previous Owners:', vehicleHistory.NumberOfPreviousKeepers || 0);
      
      if (vehicleHistory.writeOffRecord) {
        console.log('\n⚠️ WRITE-OFF DETAILS:');
        console.log(JSON.stringify(vehicleHistory.writeoff, null, 2));
      }
      
      if (vehicleHistory.stolenRecord) {
        console.log('\n🚨 STOLEN DETAILS:');
        console.log(JSON.stringify(vehicleHistory.stolen, null, 2));
      }
      
      if (vehicleHistory.financeRecord) {
        console.log('\n💰 FINANCE DETAILS:');
        console.log(JSON.stringify(vehicleHistory.finance, null, 2));
      }
      
    } catch (error) {
      console.error(`\n❌ Error checking ${vrm}:`, error.message);
    }
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('If all vehicles show clean history, it means:');
  console.log('1. Test registrations are all clean vehicles');
  console.log('2. API might have limited data');
  console.log('3. Need to test with known problematic registrations');
  console.log('\nIn real world, you would expect variety in vehicle history.');
}

testVehicleHistory().catch(console.error);
