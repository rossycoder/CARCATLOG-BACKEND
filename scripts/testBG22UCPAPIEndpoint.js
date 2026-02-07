/**
 * Test BG22UCP - Check Vehicle History from API
 * Specifically checking for write-off category (Category S)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testBG22UCPHistory() {
  try {
    console.log('🔍 Fetching BG22UCP Vehicle History from API...\n');
    
    const vrm = 'BG22UCP';
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 CALLING API: Vehicle History Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`VRM: ${vrm}`);
    console.log(`Endpoint: carhistorycheck`);
    console.log(`Cost: £1.82`);
    console.log('');
    
    // Fetch vehicle history using the singleton client
    const rawData = await checkCarDetailsClient.getVehicleHistory(vrm);
    const historyData = checkCarDetailsClient.parseResponse(rawData);
    
    console.log('✅ API Response Received\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚗 BASIC VEHICLE DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`VRM: ${historyData.vrm || 'N/A'}`);
    console.log(`Make: ${historyData.make || 'N/A'}`);
    console.log(`Model: ${historyData.model || 'N/A'}`);
    console.log(`Variant: ${historyData.variant || 'N/A'}`);
    console.log(`Color: ${historyData.colour || 'N/A'}`);
    console.log(`Year: ${historyData.yearOfManufacture || 'N/A'}`);
    console.log(`Fuel Type: ${historyData.fuelType || 'N/A'}`);
    console.log(`Body Type: ${historyData.bodyType || 'N/A'}`);
    console.log(`Transmission: ${historyData.transmission || 'N/A'}`);
    console.log(`Engine: ${historyData.engineCapacity || 'N/A'}cc`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 WRITE-OFF STATUS (CATEGORY S CHECK)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Is Written Off: ${historyData.isWrittenOff ? '⚠️  YES' : '✅ NO'}`);
    console.log(`Write-Off Category: ${historyData.writeOffCategory || 'none'}`);
    
    if (historyData.isWrittenOff) {
      console.log(`\n⚠️  WARNING: This vehicle HAS been written off!`);
      console.log(`\nWrite-Off Details:`);
      if (historyData.writeOffDetails) {
        console.log(`   Category: ${historyData.writeOffDetails.category || 'Unknown'}`);
        console.log(`   Date: ${historyData.writeOffDetails.date ? new Date(historyData.writeOffDetails.date).toLocaleDateString('en-GB') : 'Unknown'}`);
        console.log(`   Description: ${historyData.writeOffDetails.description || 'No description'}`);
      }
      
      console.log(`\n📋 Category Explanation:`);
      const category = historyData.writeOffCategory;
      if (category === 'S') {
        console.log(`   Category S: Structural damage - Can be repaired and put back on road`);
        console.log(`   Impact: Vehicle must be re-registered with DVLA after repair`);
        console.log(`   Value Impact: Typically 20-40% reduction in value`);
      } else if (category === 'N') {
        console.log(`   Category N: Non-structural damage - Can be repaired and put back on road`);
        console.log(`   Impact: No re-registration required`);
        console.log(`   Value Impact: Typically 10-20% reduction in value`);
      } else if (category === 'A') {
        console.log(`   Category A: Total loss - Must be crushed, cannot be repaired`);
      } else if (category === 'B') {
        console.log(`   Category B: Break for parts only - Body shell must be crushed`);
      } else if (category === 'C') {
        console.log(`   Category C (Old): Repair costs exceed vehicle value (pre-2017)`);
      } else if (category === 'D') {
        console.log(`   Category D (Old): Economically repairable (pre-2017)`);
      }
    } else {
      console.log(`\n✅ Good News: No write-off record found for this vehicle`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 OTHER HISTORY FLAGS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Stolen: ${historyData.isStolen ? '🚨 YES' : '✅ No'}`);
    console.log(`Scrapped: ${historyData.isScrapped ? '⚠️  YES' : '✅ No'}`);
    console.log(`Imported: ${historyData.isImported ? '⚠️  YES' : '✅ No'}`);
    console.log(`Exported: ${historyData.isExported ? '⚠️  YES' : '✅ No'}`);
    console.log(`Outstanding Finance: ${historyData.hasOutstandingFinance ? '💰 YES' : '✅ No'}`);
    console.log(`Accident History: ${historyData.hasAccidentHistory ? '⚠️  YES' : '✅ No'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 OWNERSHIP HISTORY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Previous Owners: ${historyData.numberOfPreviousKeepers || historyData.previousOwners || 0}`);
    console.log(`Plate Changes: ${historyData.plateChanges || 0}`);
    console.log(`Color Changes: ${historyData.colourChanges || 0}`);
    console.log(`V5C Certificates: ${historyData.v5cCertificateCount || 0}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 RUNNING COSTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Urban MPG: ${historyData.urbanMpg || 'N/A'}`);
    console.log(`Extra Urban MPG: ${historyData.extraUrbanMpg || 'N/A'}`);
    console.log(`Combined MPG: ${historyData.combinedMpg || 'N/A'}`);
    console.log(`CO2 Emissions: ${historyData.co2Emissions || 'N/A'} g/km`);
    console.log(`Insurance Group: ${historyData.insuranceGroup || 'N/A'}`);
    console.log(`Annual Tax: £${historyData.annualTax || 'N/A'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (historyData.isWrittenOff) {
      console.log(`\n⚠️  IMPORTANT: BG22UCP has a write-off record!`);
      console.log(`   Category: ${historyData.writeOffCategory}`);
      console.log(`   This MUST be displayed prominently to potential buyers.`);
      console.log(`   Buyers have the right to know about write-off history.`);
    } else {
      console.log(`\n✅ BG22UCP has a clean history - no write-off record.`);
    }
    
    console.log(`\nAPI Check Status: ${historyData.checkStatus}`);
    console.log(`Data Source: ${historyData.apiProvider || 'CheckCarDetails'}`);
    
    // Show raw data for debugging
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 RAW API DATA (for debugging)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(historyData, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error fetching vehicle history:');
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);
      
      if (error.response.status === 403) {
        console.error(`\n⚠️  API Access Issue:`);
        console.error(`   This could be due to:`);
        console.error(`   1. Daily API limit exceeded`);
        console.error(`   2. Invalid API key`);
        console.error(`   3. Test mode restrictions (VRM must contain 'A')`);
      }
    }
    
    console.error('\nFull error:', error);
  }
}

// Run the test
testBG22UCPHistory();
