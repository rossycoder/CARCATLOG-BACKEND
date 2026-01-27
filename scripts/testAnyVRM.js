/**
 * Test vehicle history for any VRM
 * Usage: node backend/scripts/testAnyVRM.js <VRM>
 * Example: node backend/scripts/testAnyVRM.js AB12CDE
 */

const mongoose = require('mongoose');
const HistoryService = require('../services/historyService');
require('dotenv').config();

async function testVRM() {
  try {
    // Get VRM from command line argument
    const vrm = process.argv[2];
    
    if (!vrm) {
      console.error('❌ Please provide a VRM as argument');
      console.log('Usage: node backend/scripts/testAnyVRM.js <VRM>');
      console.log('Example: node backend/scripts/testAnyVRM.js AB12CDE');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    console.log(`\n🔍 Testing Vehicle History for VRM: ${vrm}`);
    console.log('='.repeat(80));
    
    // Create history service instance
    const historyService = new HistoryService();
    
    // Fetch vehicle history (will use cache if available, otherwise call API)
    console.log('\n📡 Fetching vehicle history...');
    const history = await historyService.checkVehicleHistory(vrm, false);
    
    console.log('\n✅ Vehicle History Retrieved:');
    console.log('='.repeat(80));
    console.log('  VRM:', history.vrm);
    console.log('  Number of Previous Keepers:', history.numberOfPreviousKeepers);
    console.log('  Previous Owners:', history.previousOwners);
    console.log('  Number of Owners:', history.numberOfOwners);
    console.log('  Has Accident History:', history.hasAccidentHistory);
    console.log('  Is Written Off:', history.isWrittenOff);
    console.log('  Is Stolen:', history.isStolen);
    console.log('  Has Outstanding Finance:', history.hasOutstandingFinance);
    console.log('  Is Scrapped:', history.isScrapped);
    console.log('  Is Imported:', history.isImported);
    console.log('  Is Exported:', history.isExported);
    console.log('  Check Status:', history.checkStatus);
    console.log('  API Provider:', history.apiProvider);
    console.log('  Check Date:', history.checkDate);
    
    console.log('\n' + '='.repeat(80));
    
    // Verify key fields
    if (history.numberOfPreviousKeepers !== undefined && history.numberOfPreviousKeepers !== null) {
      console.log(`✅ numberOfPreviousKeepers is set: ${history.numberOfPreviousKeepers}`);
    } else {
      console.log('⚠️  numberOfPreviousKeepers is not set');
    }
    
    if (history.previousOwners === history.numberOfPreviousKeepers && 
        history.numberOfOwners === history.numberOfPreviousKeepers) {
      console.log('✅ All owner fields are consistent');
    } else {
      console.log('⚠️  Owner fields are inconsistent:');
      console.log('   numberOfPreviousKeepers:', history.numberOfPreviousKeepers);
      console.log('   previousOwners:', history.previousOwners);
      console.log('   numberOfOwners:', history.numberOfOwners);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.isDailyLimitError || error.details?.status === 403) {
      console.log('\n⚠️  API Daily Limit Exceeded');
      console.log('💡 The CheckCarDetails API has reached its daily limit');
      console.log('💡 Please try again in 24 hours or contact API support');
    } else if (error.details?.status === 404) {
      console.log('\n⚠️  Vehicle Not Found');
      console.log('💡 No data available for this VRM in the API');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testVRM();
