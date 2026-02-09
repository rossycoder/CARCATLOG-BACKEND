/**
 * Test: Test parser only without database
 */

const ApiResponseParser = require('./utils/apiResponseParser');
const fs = require('fs');

// Load the saved API response
const specsData = JSON.parse(fs.readFileSync('api-response-vehiclespecs.json', 'utf8'));

console.log('='.repeat(70));
console.log('TEST: Parser Running Costs Extraction');
console.log('='.repeat(70));
console.log();

console.log('Testing with saved API response...');
console.log();

// Parse the response
const parsed = ApiResponseParser.parseCheckCarDetailsResponse(specsData);

console.log('Parsed Running Costs:');
console.log('='.repeat(70));
console.log('Urban MPG:', parsed.urbanMpg);
console.log('Extra Urban MPG:', parsed.extraUrbanMpg);
console.log('Combined MPG:', parsed.combinedMpg);
console.log('CO2 Emissions:', parsed.co2Emissions);
console.log('Insurance Group:', parsed.insuranceGroup);
console.log('Annual Tax:', parsed.annualTax);
console.log('='.repeat(70));
console.log();

// Expected values from API
console.log('Expected values (from SmmtDetails):');
console.log('- Urban MPG: 37.2');
console.log('- Extra Urban MPG: 57.7');
console.log('- Combined MPG: 47.9');
console.log('- CO2: 156');
console.log();

// Verify
if (parsed.combinedMpg === 47.9 && parsed.co2Emissions === 156) {
  console.log('🎉 SUCCESS: Parser is correctly extracting running costs from SmmtDetails!');
} else {
  console.log('❌ FAILED: Parser is not extracting running costs correctly');
  console.log();
  console.log('Actual values:');
  console.log(`- Urban MPG: ${parsed.urbanMpg}`);
  console.log(`- Extra Urban MPG: ${parsed.extraUrbanMpg}`);
  console.log(`- Combined MPG: ${parsed.combinedMpg}`);
  console.log(`- CO2: ${parsed.co2Emissions}`);
}
