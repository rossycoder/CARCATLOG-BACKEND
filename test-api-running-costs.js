/**
 * Test: Check if API is returning running costs data
 */

require('dotenv').config();
const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');
const ApiResponseParser = require('./utils/apiResponseParser');

async function testAPIRunningCosts() {
  console.log('='.repeat(70));
  console.log('TEST: API Running Costs Data');
  console.log('='.repeat(70));
  console.log();

  const testVRM = 'AY10AYL'; // Using existing car from database

  try {
    const client = new CheckCarDetailsClient();
    
    console.log(`Testing with VRM: ${testVRM}`);
    console.log(`API Base URL: ${client.baseURL}`);
    console.log(`API Mode: ${client.isTestMode ? 'TEST' : 'PRODUCTION'}`);
    console.log();

    // Test 1: Get UK Vehicle Data (includes running costs)
    console.log('Test 1: Fetching UK Vehicle Data...');
    console.log('='.repeat(70));
    try {
      const ukData = await client.getUKVehicleData(testVRM);
      console.log('✅ API Response received');
      console.log();
      
      // Check if running costs fields exist in raw response
      console.log('Raw API Response Structure:');
      console.log('- ModelData:', ukData.ModelData ? 'EXISTS' : 'MISSING');
      console.log('- Performance:', ukData.Performance ? 'EXISTS' : 'MISSING');
      console.log('- Performance.FuelEconomy:', ukData.Performance?.FuelEconomy ? 'EXISTS' : 'MISSING');
      console.log('- Emissions:', ukData.Emissions ? 'EXISTS' : 'MISSING');
      console.log();
      
      if (ukData.ModelData) {
        console.log('ModelData fields:');
        console.log('- InsuranceGroup:', ukData.ModelData.InsuranceGroup);
        console.log('- AnnualTax:', ukData.ModelData.AnnualTax);
        console.log('- VehicleTax:', ukData.ModelData.VehicleTax);
      }
      console.log();
      
      if (ukData.Performance?.FuelEconomy) {
        console.log('FuelEconomy fields:');
        console.log('- UrbanColdMpg:', ukData.Performance.FuelEconomy.UrbanColdMpg);
        console.log('- ExtraUrbanMpg:', ukData.Performance.FuelEconomy.ExtraUrbanMpg);
        console.log('- CombinedMpg:', ukData.Performance.FuelEconomy.CombinedMpg);
      }
      console.log();
      
      if (ukData.Emissions) {
        console.log('Emissions fields:');
        console.log('- ManufacturerCo2:', ukData.Emissions.ManufacturerCo2);
      }
      console.log();
      
      // Parse the response
      console.log('Parsing API response...');
      const parsedData = ApiResponseParser.parseCheckCarDetailsResponse(ukData);
      console.log('✅ Parsed successfully');
      console.log();
      
      console.log('Parsed Running Costs:');
      console.log('- urbanMpg:', parsedData.urbanMpg);
      console.log('- extraUrbanMpg:', parsedData.extraUrbanMpg);
      console.log('- combinedMpg:', parsedData.combinedMpg);
      console.log('- co2Emissions:', parsedData.co2Emissions);
      console.log('- insuranceGroup:', parsedData.insuranceGroup);
      console.log('- annualTax:', parsedData.annualTax);
      console.log();
      
      // Check if any running costs data exists
      const hasRunningCosts = parsedData.urbanMpg || parsedData.extraUrbanMpg || 
                             parsedData.combinedMpg || parsedData.co2Emissions || 
                             parsedData.insuranceGroup || parsedData.annualTax;
      
      if (hasRunningCosts) {
        console.log('✅ SUCCESS: API is returning running costs data');
      } else {
        console.log('❌ ISSUE: API response contains no running costs data');
        console.log();
        console.log('This could mean:');
        console.log('1. The API endpoint does not include running costs');
        console.log('2. This specific vehicle has no running costs data');
        console.log('3. The API key does not have access to running costs data');
      }
      
    } catch (error) {
      console.error('❌ API call failed:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log();
    console.log('='.repeat(70));
    
    // Test 2: Get Vehicle Specs (alternative endpoint)
    console.log('Test 2: Fetching Vehicle Specs...');
    console.log('='.repeat(70));
    try {
      const specsData = await client.getVehicleSpecs(testVRM);
      console.log('✅ API Response received');
      console.log();
      
      console.log('Specs Response Structure:');
      console.log(JSON.stringify(specsData, null, 2).substring(0, 500) + '...');
      console.log();
      
      const parsedSpecs = ApiResponseParser.parseCheckCarDetailsResponse(specsData);
      console.log('Parsed Specs Running Costs:');
      console.log('- insuranceGroup:', parsedSpecs.insuranceGroup);
      console.log('- annualTax:', parsedSpecs.annualTax);
      console.log('- combinedMpg:', parsedSpecs.combinedMpg);
      
    } catch (error) {
      console.error('❌ Specs API call failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testAPIRunningCosts();
