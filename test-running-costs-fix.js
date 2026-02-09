/**
 * Test: Verify running costs fix is working
 */

require('dotenv').config();
const UniversalAutoCompleteService = require('./services/universalAutoCompleteService');

async function testRunningCostsFix() {
  console.log('='.repeat(70));
  console.log('TEST: Running Costs Fix Verification');
  console.log('='.repeat(70));
  console.log();

  const testVRM = 'AY10AYL';

  try {
    const service = new UniversalAutoCompleteService();
    
    console.log(`Testing with VRM: ${testVRM}`);
    console.log('Calling universalAutoCompleteService.fetchCompleteVehicleData()...');
    console.log();

    const result = await service.fetchCompleteVehicleData(testVRM, 50000, false);
    
    console.log('✅ Service call successful');
    console.log();
    console.log('='.repeat(70));
    console.log('RUNNING COSTS DATA:');
    console.log('='.repeat(70));
    console.log('Urban MPG:', result.urbanMpg);
    console.log('Extra Urban MPG:', result.extraUrbanMpg);
    console.log('Combined MPG:', result.combinedMpg);
    console.log('CO2 Emissions:', result.co2Emissions);
    console.log('Insurance Group:', result.insuranceGroup);
    console.log('Annual Tax:', result.annualTax);
    console.log();
    console.log('Running Costs Object:');
    console.log(JSON.stringify(result.runningCosts, null, 2));
    console.log('='.repeat(70));
    console.log();

    // Verify data
    const hasRunningCosts = result.urbanMpg || result.extraUrbanMpg || 
                           result.combinedMpg || result.co2Emissions;
    
    if (hasRunningCosts) {
      console.log('✅ SUCCESS: Running costs data is now being extracted!');
      console.log();
      console.log('Expected values (from API):');
      console.log('- Urban MPG: 37.2');
      console.log('- Extra Urban MPG: 57.7');
      console.log('- Combined MPG: 47.9');
      console.log('- CO2: 156');
      console.log();
      console.log('Actual values:');
      console.log(`- Urban MPG: ${result.urbanMpg}`);
      console.log(`- Extra Urban MPG: ${result.extraUrbanMpg}`);
      console.log(`- Combined MPG: ${result.combinedMpg}`);
      console.log(`- CO2: ${result.co2Emissions}`);
      console.log();
      
      if (result.combinedMpg === 47.9 && result.co2Emissions === 156) {
        console.log('🎉 PERFECT MATCH! Fix is working correctly!');
      } else {
        console.log('⚠️  Values don\'t match exactly, but data is being extracted');
      }
    } else {
      console.log('❌ FAILED: Running costs data is still null');
      console.log();
      console.log('Check the service logs above for parsing errors');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testRunningCostsFix();
