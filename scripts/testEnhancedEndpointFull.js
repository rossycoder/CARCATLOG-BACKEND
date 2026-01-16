/**
 * Test the complete enhanced vehicle lookup endpoint
 * This simulates what the frontend receives
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function testEnhancedEndpoint() {
  console.log('=== Testing Enhanced Vehicle Endpoint ===\n');

  const testVRM = 'AB12CDE';

  try {
    console.log(`Testing with VRM: ${testVRM}\n`);

    // Call the service method that the controller uses
    const result = await enhancedVehicleService.getVehicleDataWithFallback(testVRM);

    if (!result.success) {
      console.error('❌ Lookup failed:', result.error);
      return;
    }

    console.log('✅ Lookup successful!\n');
    console.log('=== Full Response (as frontend receives) ===');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n=== Data Sources ===');
    console.log(`DVLA: ${result.data.dataSources?.dvla ? '✅' : '❌'}`);
    console.log(`CheckCarDetails: ${result.data.dataSources?.checkCarDetails ? '✅' : '❌'}`);
    console.log(`Valuation: ${result.data.dataSources?.valuation ? '✅' : '❌'}`);

    console.log('\n=== Running Costs Data ===');
    const runningCosts = result.data.runningCosts;
    if (runningCosts) {
      console.log('Fuel Economy:');
      console.log(`  Urban: ${runningCosts.fuelEconomy?.urban?.value || 'N/A'} mpg (source: ${runningCosts.fuelEconomy?.urban?.source || 'N/A'})`);
      console.log(`  Extra Urban: ${runningCosts.fuelEconomy?.extraUrban?.value || 'N/A'} mpg (source: ${runningCosts.fuelEconomy?.extraUrban?.source || 'N/A'})`);
      console.log(`  Combined: ${runningCosts.fuelEconomy?.combined?.value || 'N/A'} mpg (source: ${runningCosts.fuelEconomy?.combined?.source || 'N/A'})`);
      console.log(`\nCO2 Emissions: ${runningCosts.co2Emissions?.value || 'N/A'} g/km (source: ${runningCosts.co2Emissions?.source || 'N/A'})`);
      console.log(`Annual Tax: £${runningCosts.annualTax?.value || 'N/A'} (source: ${runningCosts.annualTax?.source || 'N/A'})`);
      console.log(`Insurance Group: ${runningCosts.insuranceGroup?.value || 'N/A'} (source: ${runningCosts.insuranceGroup?.source || 'N/A'})`);
    } else {
      console.log('No running costs data available');
    }

    console.log('\n=== Performance Data ===');
    const performance = result.data.performance;
    if (performance) {
      console.log(`Power: ${performance.power?.value || 'N/A'} bhp (source: ${performance.power?.source || 'N/A'})`);
      console.log(`Torque: ${performance.torque?.value || 'N/A'} Nm (source: ${performance.torque?.source || 'N/A'})`);
      console.log(`0-60: ${performance.acceleration?.value || 'N/A'} seconds (source: ${performance.acceleration?.source || 'N/A'})`);
      console.log(`Top Speed: ${performance.topSpeed?.value || 'N/A'} mph (source: ${performance.topSpeed?.source || 'N/A'})`);
    } else {
      console.log('No performance data available');
    }

    console.log('\n=== Valuation Data ===');
    const valuation = result.data.valuation;
    if (valuation) {
      console.log(`Dealer Price: £${valuation.dealerPrice?.value || 'N/A'} (source: ${valuation.dealerPrice?.source || 'N/A'})`);
      console.log(`Private Price: £${valuation.privatePrice?.value || 'N/A'} (source: ${valuation.privatePrice?.source || 'N/A'})`);
      console.log(`Part Exchange: £${valuation.partExchangePrice?.value || 'N/A'} (source: ${valuation.partExchangePrice?.source || 'N/A'})`);
      console.log(`Mileage: ${valuation.mileage?.value || 'N/A'}`);
    } else {
      console.log('No valuation data available');
    }

    console.log('\n=== Warnings ===');
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log(`⚠️  ${warning}`));
    } else {
      console.log('No warnings');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n=== Test Complete ===');
}

testEnhancedEndpoint()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
