/**
 * Test Enhanced Lookup API
 * Tests that the enhanced lookup endpoint returns running costs and emission class
 */

require('dotenv').config();
const axios = require('axios');

async function testEnhancedLookupAPI() {
  try {
    console.log('🧪 Testing Enhanced Lookup API\n');
    
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const testVRMs = [
      'NU10YEV',  // SKODA OCTAVIA
      'BG22UCP',  // BMW i4 Electric
      'EK11XHZ'   // HONDA CIVIC
    ];
    
    for (const vrm of testVRMs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing VRM: ${vrm}`);
      console.log('='.repeat(60));
      
      const url = `${baseURL}/api/vehicles/enhanced-lookup/${vrm}?mileage=50000`;
      console.log(`\n📡 Calling API: ${url}`);
      
      try {
        const response = await axios.get(url);
        
        console.log(`\n✅ API Response Status: ${response.status}`);
        console.log(`\n📋 Response Data:`);
        
        const data = response.data.data;
        
        console.log(`   Make/Model: ${data.make} ${data.model}`);
        console.log(`   Variant: ${data.variant || 'N/A'}`);
        console.log(`   Year: ${data.year || 'N/A'}`);
        console.log(`   Fuel Type: ${data.fuelType || 'N/A'}`);
        
        console.log(`\n🏃 Running Costs:`);
        console.log(`   Combined MPG: ${data.fuelEconomyCombined || 'NULL'}`);
        console.log(`   Urban MPG: ${data.fuelEconomyUrban || 'NULL'}`);
        console.log(`   Extra Urban MPG: ${data.fuelEconomyExtraUrban || 'NULL'}`);
        console.log(`   CO2 Emissions: ${data.co2Emissions || 'NULL'}`);
        console.log(`   Insurance Group: ${data.insuranceGroup || 'NULL'}`);
        console.log(`   Annual Tax: ${data.annualTax || 'NULL'}`);
        console.log(`   Emission Class: ${data.emissionClass || 'NULL'} ⭐`);
        
        console.log(`\n📦 Running Costs Object:`);
        if (data.runningCosts) {
          console.log(`   Type: ${typeof data.runningCosts}`);
          console.log(`   Fuel Economy:`);
          console.log(`     - Urban: ${data.runningCosts.fuelEconomy?.urban || 'NULL'}`);
          console.log(`     - Extra Urban: ${data.runningCosts.fuelEconomy?.extraUrban || 'NULL'}`);
          console.log(`     - Combined: ${data.runningCosts.fuelEconomy?.combined || 'NULL'}`);
          console.log(`   CO2: ${data.runningCosts.co2Emissions || 'NULL'}`);
          console.log(`   Insurance: ${data.runningCosts.insuranceGroup || 'NULL'}`);
          console.log(`   Annual Tax: ${data.runningCosts.annualTax || 'NULL'}`);
          console.log(`   Emission Class: ${data.runningCosts.emissionClass || 'NULL'} ⭐`);
        } else {
          console.log(`   NULL - No running costs object!`);
        }
        
        console.log(`\n💰 Valuation:`);
        console.log(`   Private Price: £${data.privatePrice || 'NULL'}`);
        console.log(`   Dealer Price: £${data.dealerPrice || 'NULL'}`);
        console.log(`   Part Exchange: £${data.partExchangePrice || 'NULL'}`);
        
        console.log(`\n🔍 MOT Data:`);
        console.log(`   Status: ${data.motStatus || 'NULL'}`);
        console.log(`   Due Date: ${data.motDue || 'NULL'}`);
        console.log(`   History Records: ${data.motHistory?.length || 0}`);
        
        // Verify fix
        const hasRunningCosts = data.fuelEconomyCombined || data.runningCosts?.fuelEconomy?.combined;
        const hasEmissionClass = data.emissionClass || data.runningCosts?.emissionClass;
        
        if (hasRunningCosts && hasEmissionClass) {
          console.log(`\n✅ FIX VERIFIED: API returns running costs and emission class!`);
        } else {
          console.log(`\n⚠️  FIX INCOMPLETE:`);
          if (!hasRunningCosts) console.log(`   - Running costs missing`);
          if (!hasEmissionClass) console.log(`   - Emission class missing`);
        }
        
      } catch (error) {
        console.error(`\n❌ API call failed:`, error.message);
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Data:`, error.response.data);
        }
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Test completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run test
testEnhancedLookupAPI();
