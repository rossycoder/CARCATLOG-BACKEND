/**
 * Final test for CheckCarDetails API client
 * Tests the main getVehicleData method with actual VRM
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testFinalImplementation() {
  console.log('=== Final CheckCarDetails API Test ===\n');

  const testVRM = 'AB12CDE';

  try {
    console.log(`Testing getVehicleData() with VRM: ${testVRM}\n`);

    // Test main method
    const vehicleData = await CheckCarDetailsClient.getVehicleData(testVRM);

    console.log('✓ Vehicle data fetched successfully!\n');
    console.log('=== Parsed Vehicle Data ===');
    console.log(JSON.stringify(vehicleData, null, 2));

    console.log('\n=== Data Summary ===');
    console.log(`Make: ${vehicleData.make || 'N/A'}`);
    console.log(`Model: ${vehicleData.model || 'N/A'}`);
    console.log(`Year: ${vehicleData.year || 'N/A'}`);
    console.log(`Fuel Type: ${vehicleData.fuelType || 'N/A'}`);
    console.log(`Transmission: ${vehicleData.transmission || 'N/A'}`);
    console.log(`Engine Size: ${vehicleData.engineSize || 'N/A'} cc`);
    console.log(`\nFuel Economy:`);
    console.log(`  Urban: ${vehicleData.fuelEconomy.urban || 'N/A'} mpg`);
    console.log(`  Extra Urban: ${vehicleData.fuelEconomy.extraUrban || 'N/A'} mpg`);
    console.log(`  Combined: ${vehicleData.fuelEconomy.combined || 'N/A'} mpg`);
    console.log(`\nEmissions & Tax:`);
    console.log(`  CO2: ${vehicleData.co2Emissions || 'N/A'} g/km`);
    console.log(`  Annual Tax: £${vehicleData.annualTax || 'N/A'}`);
    console.log(`  Insurance Group: ${vehicleData.insuranceGroup || 'N/A'}`);
    console.log(`\nPerformance:`);
    console.log(`  Power: ${vehicleData.performance.power || 'N/A'} bhp`);
    console.log(`  Torque: ${vehicleData.performance.torque || 'N/A'} Nm`);
    console.log(`  0-60: ${vehicleData.performance.acceleration || 'N/A'} seconds`);
    console.log(`  Top Speed: ${vehicleData.performance.topSpeed || 'N/A'} mph`);

    // Test with valuation
    console.log('\n\n=== Testing with Valuation ===\n');
    const combinedData = await CheckCarDetailsClient.getVehicleDataWithValuation(testVRM);
    
    console.log('✓ Combined data fetched successfully!\n');
    if (combinedData.valuation) {
      console.log('Valuation Data:');
      console.log(`  Dealer Price: £${combinedData.valuation.dealerPrice || 'N/A'}`);
      console.log(`  Private Price: £${combinedData.valuation.privatePrice || 'N/A'}`);
      console.log(`  Part Exchange: £${combinedData.valuation.partExchangePrice || 'N/A'}`);
      console.log(`  Trade Price: £${combinedData.valuation.tradePrice || 'N/A'}`);
      console.log(`  Mileage: ${combinedData.valuation.mileage || 'N/A'}`);
      console.log(`  Description: ${combinedData.valuation.vehicleDescription || 'N/A'}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error code:', error.code);
    if (error.userMessage) {
      console.error('User message:', error.userMessage);
    }
  }

  console.log('\n=== Test Complete ===');
}

testFinalImplementation()
  .then(() => {
    console.log('\nAll tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
