/**
 * Debug Vehicle Issues
 * Test valuation, MOT, and Cat N status for a specific vehicle
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testVehicle(vrm, mileage) {
  const apiKey = process.env.CHECKCARD_API_KEY;
  const baseUrl = process.env.CHECKCARD_API_BASE_URL;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 TESTING VEHICLE: ${vrm} with ${mileage} miles`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Test 1: Valuation
  console.log('📊 TEST 1: VALUATION');
  console.log('-'.repeat(80));
  try {
    const valuationUrl = `${baseUrl}/vehicledata/vehiclevaluation`;
    const valuationResponse = await axios.get(valuationUrl, {
      params: {
        apikey: apiKey,
        vrm: vrm.toUpperCase(),
        mileage: mileage
      },
      timeout: 10000
    });
    
    console.log('✅ Valuation API Response:');
    console.log(JSON.stringify(valuationResponse.data, null, 2));
    
    if (valuationResponse.data.ValuationList) {
      console.log('\n💰 VALUATION PRICES:');
      console.log(`  Dealer Forecourt: £${valuationResponse.data.ValuationList.DealerForecourt || 0}`);
      console.log(`  Trade Average: £${valuationResponse.data.ValuationList.TradeAverage || 0}`);
      console.log(`  Part Exchange: £${valuationResponse.data.ValuationList.PartExchange || 0}`);
      console.log(`  Private Clean: £${valuationResponse.data.ValuationList.PrivateClean || 0}`);
      
      // Check if all values are £1000
      const values = [
        valuationResponse.data.ValuationList.DealerForecourt,
        valuationResponse.data.ValuationList.TradeAverage,
        valuationResponse.data.ValuationList.PartExchange,
        valuationResponse.data.ValuationList.PrivateClean
      ];
      
      if (values.every(v => v == 1000)) {
        console.log('\n⚠️  WARNING: All valuations are £1000 - this may indicate an API issue or vehicle not in database');
      }
    }
  } catch (error) {
    console.error('❌ Valuation API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Test 2: MOT History
  console.log('\n\n🔧 TEST 2: MOT HISTORY');
  console.log('-'.repeat(80));
  try {
    const motUrl = `${baseUrl}/vehicledata/mot`;
    const motResponse = await axios.get(motUrl, {
      params: {
        apikey: apiKey,
        vrm: vrm.toUpperCase()
      },
      timeout: 10000
    });
    
    console.log('✅ MOT API Response:');
    console.log(JSON.stringify(motResponse.data, null, 2));
    
    if (motResponse.data.motHistory && motResponse.data.motHistory.length > 0) {
      console.log('\n📋 LATEST MOT TEST:');
      const latestMot = motResponse.data.motHistory[0];
      console.log(`  Test Date: ${latestMot.completedDate || 'N/A'}`);
      console.log(`  Result: ${latestMot.testResult || 'N/A'}`);
      console.log(`  Expiry Date: ${latestMot.expiryDate || 'N/A'}`);
      console.log(`  Mileage: ${latestMot.odometerValue || 'N/A'} ${latestMot.odometerUnit || 'mi'}`);
    }
  } catch (error) {
    console.error('❌ MOT API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Test 3: Vehicle History (Cat N check)
  console.log('\n\n🚗 TEST 3: VEHICLE HISTORY (Cat N / Write-off Check)');
  console.log('-'.repeat(80));
  try {
    const historyUrl = `${baseUrl}/vehicledata/carhistorycheck`;
    const historyResponse = await axios.get(historyUrl, {
      params: {
        apikey: apiKey,
        vrm: vrm.toUpperCase()
      },
      timeout: 10000
    });
    
    console.log('✅ History API Response:');
    console.log(JSON.stringify(historyResponse.data, null, 2));
    
    const vehicleHistory = historyResponse.data.VehicleHistory || {};
    
    console.log('\n🔍 WRITE-OFF STATUS:');
    console.log(`  Write-off Record: ${vehicleHistory.writeOffRecord ? 'YES' : 'NO'}`);
    
    if (vehicleHistory.writeOffRecord && vehicleHistory.writeoff) {
      const writeoffData = Array.isArray(vehicleHistory.writeoff) 
        ? vehicleHistory.writeoff[0] 
        : vehicleHistory.writeoff;
      
      console.log(`  Category: ${writeoffData.category || 'Unknown'}`);
      console.log(`  Status: ${writeoffData.status || 'Unknown'}`);
      console.log(`  Loss Date: ${writeoffData.lossdate || 'Unknown'}`);
      console.log(`  Miaftr: ${writeoffData.miaftr || 'Unknown'}`);
      
      // Extract category from status if not in category field
      let category = 'unknown';
      if (writeoffData.category) {
        category = writeoffData.category;
      } else if (writeoffData.status) {
        const status = writeoffData.status.toUpperCase();
        if (status.includes('CAT A') || status.includes('CATEGORY A')) category = 'A';
        else if (status.includes('CAT B') || status.includes('CATEGORY B')) category = 'B';
        else if (status.includes('CAT C') || status.includes('CATEGORY C')) category = 'C';
        else if (status.includes('CAT D') || status.includes('CATEGORY D')) category = 'D';
        else if (status.includes('CAT S') || status.includes('CATEGORY S')) category = 'S';
        else if (status.includes('CAT N') || status.includes('CATEGORY N')) category = 'N';
      }
      
      console.log(`  Extracted Category: ${category}`);
      
      if (category === 'N') {
        console.log('\n⚠️  CAT N DETECTED: This vehicle has been written off (non-structural damage)');
      }
    } else {
      console.log('  ✅ No write-off record found - vehicle appears clear');
    }
    
    console.log('\n🔍 OTHER CHECKS:');
    console.log(`  Stolen Record: ${vehicleHistory.stolenRecord ? 'YES ⚠️' : 'NO ✅'}`);
    console.log(`  Finance Record: ${vehicleHistory.financeRecord ? 'YES ⚠️' : 'NO ✅'}`);
    console.log(`  Previous Keepers: ${vehicleHistory.NumberOfPreviousKeepers || 0}`);
    
  } catch (error) {
    console.error('❌ History API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

// Get VRM from command line or use default
const vrm = process.argv[2] || 'MX08XMT';
const mileage = process.argv[3] || 100000;

testVehicle(vrm, mileage).then(() => {
  console.log('✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
