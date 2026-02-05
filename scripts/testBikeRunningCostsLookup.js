/**
 * Test Bike Running Costs Lookup
 * Tests the bike lookup API and running costs auto-fill functionality
 */

const lightweightBikeService = require('../services/lightweightBikeService');

async function testBikeRunningCostsLookup() {
  console.log('🏍️ TESTING BIKE RUNNING COSTS LOOKUP');
  console.log('==================================================');
  
  // Test registrations - mix of real and test
  const testRegistrations = [
    { reg: 'SD69UOY', mileage: 2500, description: 'User test registration' },
    { reg: 'AB12CDE', mileage: 5000, description: 'Mock test registration' },
    { reg: 'TEST123', mileage: 1000, description: 'Test registration' }
  ];
  
  for (const test of testRegistrations) {
    console.log(`\n📡 Testing: ${test.reg} (${test.description})`);
    console.log('--------------------------------------------------');
    
    try {
      const result = await lightweightBikeService.getBasicBikeData(test.reg, test.mileage);
      
      if (result.success) {
        console.log('✅ Lookup successful!');
        console.log(`   Make: ${result.data.make || 'N/A'}`);
        console.log(`   Model: ${result.data.model || 'N/A'}`);
        console.log(`   Year: ${result.data.year || 'N/A'}`);
        console.log(`   Engine: ${result.data.engineSize || result.data.engineCC + 'cc' || 'N/A'}`);
        console.log(`   Bike Type: ${result.data.bikeType || 'N/A'}`);
        console.log(`   Estimated Value: £${result.data.estimatedValue || 'N/A'}`);
        
        // Check running costs
        console.log('\n💰 Running Costs Data:');
        console.log(`   Combined MPG: ${result.data.combinedMpg || 'N/A'}`);
        console.log(`   Annual Tax: £${result.data.annualTax || 'N/A'}`);
        console.log(`   Insurance Group: ${result.data.insuranceGroup || 'N/A'}`);
        console.log(`   CO2 Emissions: ${result.data.co2Emissions || 'N/A'}g/km`);
        
        console.log('\n📊 API Info:');
        console.log(`   API Provider: ${result.data.apiProvider}`);
        console.log(`   From Cache: ${result.fromCache}`);
        console.log(`   API Calls: ${result.apiCalls}`);
        console.log(`   Cost: £${result.cost}`);
        
        // Check if running costs are available
        const hasRunningCosts = result.data.combinedMpg || result.data.annualTax || result.data.insuranceGroup;
        if (hasRunningCosts) {
          console.log('✅ Running costs data available - auto-fill should work!');
        } else {
          console.log('⚠️ No running costs data - will need manual entry');
        }
        
      } else {
        console.log('❌ Lookup failed:', result.error);
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('   If running costs data is available, it should auto-fill in the frontend');
  console.log('   If APIs fail, the system should still work with manual data entry');
  console.log('   Check the BikeAdvertEditPage.jsx for auto-fill logic');
}

// Run the test
testBikeRunningCostsLookup().catch(console.error);