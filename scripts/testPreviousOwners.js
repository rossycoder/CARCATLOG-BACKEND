require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const HistoryService = require('../services/historyService');

async function testPreviousOwners() {
  console.log('\n============================================================');
  console.log('Testing Previous Owners Data from CheckCarDetails API');
  console.log('============================================================\n');

  // Test VRM - use a real UK registration
  const testVRM = 'AB12CDE'; // Test VRM (must contain 'A' for test mode)
  
  console.log(`Test VRM: ${testVRM}`);
  console.log(`API Environment: ${process.env.API_ENVIRONMENT}`);
  console.log(`API Key: ${process.env.HISTORY_API_LIVE_KEY ? process.env.HISTORY_API_LIVE_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log('============================================================\n');

  try {
    const historyService = new HistoryService();
    
    console.log('📞 Calling CheckCarDetails API...\n');
    const result = await historyService.checkVehicleHistory(testVRM, true);
    
    console.log('\n✅ API Call Successful!');
    console.log('============================================================');
    console.log('Vehicle History Data:');
    console.log('============================================================');
    console.log(`VRM: ${result.vrm}`);
    console.log(`Make: ${result.make}`);
    console.log(`Model: ${result.model}`);
    console.log(`Colour: ${result.colour}`);
    console.log(`Year: ${result.yearOfManufacture}`);
    console.log('------------------------------------------------------------');
    console.log(`🔑 Previous Owners: ${result.numberOfPreviousKeepers}`);
    console.log(`🎨 Colour Changes: ${result.colourChanges}`);
    console.log(`🔢 Plate Changes: ${result.plateChanges}`);
    console.log(`📦 Exported: ${result.exported}`);
    console.log(`🗑️  Scrapped: ${result.scrapped}`);
    console.log(`📥 Imported: ${result.imported}`);
    console.log('============================================================\n');
    
    if (result.numberOfPreviousKeepers === 0) {
      console.log('⚠️  WARNING: Previous Owners showing as 0');
      console.log('   This might be correct, or the API field name might be different');
      console.log('   Check the console logs above for the raw API response\n');
    }
    
  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('============================================================');
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
    console.error('============================================================\n');
    process.exit(1);
  }
}

testPreviousOwners();
