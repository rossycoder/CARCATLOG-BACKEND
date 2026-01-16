/**
 * Test to verify the exact data structure that frontend receives
 * This simulates what the hook will extract
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const enhancedVehicleService = require('../services/enhancedVehicleService');

// Simulate the extractValues function from useEnhancedVehicleLookup
function extractValues(data) {
  const extract = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    
    // If this is a {value, source} object, extract the value
    if (obj.value !== undefined && obj.source !== undefined) {
      return obj.value;
    }
    
    // Recursively extract values from nested objects
    const result = {};
    Object.keys(obj).forEach(key => {
      result[key] = extract(obj[key]);
    });
    return result;
  };

  const extracted = extract(data);
  
  // Preserve fieldSources and dataSources at the root level
  if (data.fieldSources) {
    extracted.fieldSources = data.fieldSources;
  }
  if (data.dataSources) {
    extracted.dataSources = data.dataSources;
  }

  return extracted;
}

async function testFrontendDataFlow() {
  console.log('=== Testing Frontend Data Flow ===\n');

  const testVRM = 'AB12CDE';

  try {
    console.log(`Step 1: Backend API Call for ${testVRM}\n`);
    
    // Get data from backend service
    const result = await enhancedVehicleService.getVehicleDataWithFallback(testVRM);

    if (!result.success) {
      console.error('❌ Backend call failed:', result.error);
      return;
    }

    console.log('✅ Backend returned data\n');

    // Simulate what frontend receives
    const apiResponse = {
      success: true,
      data: result.data,
      warnings: result.warnings,
      dataSources: result.data.dataSources
    };

    console.log('Step 2: Frontend receives API response\n');
    console.log('Raw API Response Structure:');
    console.log('- success:', apiResponse.success);
    console.log('- data.runningCosts:', typeof apiResponse.data.runningCosts);
    console.log('- data.runningCosts.fuelEconomy:', typeof apiResponse.data.runningCosts?.fuelEconomy);
    console.log('- data.runningCosts.fuelEconomy.urban:', apiResponse.data.runningCosts?.fuelEconomy?.urban);

    console.log('\nStep 3: Hook extracts values\n');
    
    // Extract values like the hook does
    const cleanData = extractValues(apiResponse.data);

    console.log('✅ Extracted clean data\n');
    console.log('Extracted Running Costs:');
    console.log(JSON.stringify(cleanData.runningCosts, null, 2));

    console.log('\nStep 4: What CarAdvertEditPage receives\n');
    console.log('enhancedData.runningCosts:');
    console.log(JSON.stringify(cleanData.runningCosts, null, 2));

    console.log('\nfieldSources.runningCosts:');
    console.log(JSON.stringify(cleanData.fieldSources?.runningCosts, null, 2));

    console.log('\ndataSources:');
    console.log(JSON.stringify(cleanData.dataSources, null, 2));

    console.log('\n=== Expected Values in Form Fields ===\n');
    console.log(`Urban MPG: ${cleanData.runningCosts?.fuelEconomy?.urban || 'N/A'}`);
    console.log(`Extra Urban MPG: ${cleanData.runningCosts?.fuelEconomy?.extraUrban || 'N/A'}`);
    console.log(`Combined MPG: ${cleanData.runningCosts?.fuelEconomy?.combined || 'N/A'}`);
    console.log(`CO2 Emissions: ${cleanData.runningCosts?.co2Emissions || 'N/A'} g/km`);
    console.log(`Annual Tax: £${cleanData.runningCosts?.annualTax || 'N/A'}`);
    console.log(`Insurance Group: ${cleanData.runningCosts?.insuranceGroup || 'N/A'}`);

    console.log('\n=== Field Source Indicators ===\n');
    console.log(`Urban source: ${cleanData.fieldSources?.runningCosts?.fuelEconomy?.urban || 'none'}`);
    console.log(`Extra Urban source: ${cleanData.fieldSources?.runningCosts?.fuelEconomy?.extraUrban || 'none'}`);
    console.log(`Combined source: ${cleanData.fieldSources?.runningCosts?.fuelEconomy?.combined || 'none'}`);
    console.log(`CO2 source: ${cleanData.fieldSources?.runningCosts?.co2Emissions || 'none'}`);
    console.log(`Annual Tax source: ${cleanData.fieldSources?.runningCosts?.annualTax || 'none'}`);

    console.log('\n=== Verification ===\n');
    
    // Verify the data is correct
    const checks = [
      { name: 'Urban MPG is number', pass: typeof cleanData.runningCosts?.fuelEconomy?.urban === 'number' },
      { name: 'Extra Urban MPG is number', pass: typeof cleanData.runningCosts?.fuelEconomy?.extraUrban === 'number' },
      { name: 'Combined MPG is number', pass: typeof cleanData.runningCosts?.fuelEconomy?.combined === 'number' },
      { name: 'CO2 is number', pass: typeof cleanData.runningCosts?.co2Emissions === 'number' },
      { name: 'Annual Tax is number', pass: typeof cleanData.runningCosts?.annualTax === 'number' },
      { name: 'Field sources exist', pass: !!cleanData.fieldSources?.runningCosts },
      { name: 'Data sources exist', pass: !!cleanData.dataSources }
    ];

    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = checks.every(c => c.pass);
    console.log(`\n${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n=== Test Complete ===');
}

testFrontendDataFlow()
  .then(() => {
    console.log('\nTest completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
