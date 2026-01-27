/**
 * Test Vehicle History Flow
 * Tests the complete flow from API to frontend
 */

require('dotenv').config();
const HistoryService = require('../services/historyService');

async function testVehicleHistoryFlow() {
  console.log('='.repeat(80));
  console.log('Testing Vehicle History Flow for RJ08PFA');
  console.log('='.repeat(80));
  
  try {
    const historyService = new HistoryService();
    
    // Test the checkVehicleHistory method
    console.log('\n📡 Calling checkVehicleHistory...');
    const result = await historyService.checkVehicleHistory('RJ08PFA', true);
    
    console.log('\n✅ Result received:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n📊 Key Fields:');
    console.log('- VRM:', result.vrm);
    console.log('- Has Accident History:', result.hasAccidentHistory);
    console.log('- Is Written Off:', result.isWrittenOff);
    console.log('- Is Stolen:', result.isStolen);
    console.log('- Is Scrapped:', result.isScrapped);
    console.log('- Is Imported:', result.isImported);
    console.log('- Is Exported:', result.isExported);
    console.log('- Previous Owners:', result.previousOwners || result.numberOfOwners);
    console.log('- Number of Keys:', result.numberOfKeys);
    console.log('- Service History:', result.serviceHistory);
    console.log('- MOT Status:', result.motStatus);
    console.log('- MOT Expiry:', result.motExpiryDate);
    
    if (result.accidentDetails) {
      console.log('\n🚗 Accident Details:');
      console.log('- Count:', result.accidentDetails.count);
      console.log('- Severity:', result.accidentDetails.severity);
      console.log('- Dates:', result.accidentDetails.dates);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completed successfully');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testVehicleHistoryFlow();
