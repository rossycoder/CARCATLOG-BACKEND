/**
 * Test: Fresh parser test with cache clearing
 */

// Clear require cache
delete require.cache[require.resolve('./utils/apiResponseParser')];

const ApiResponseParser = require('./utils/apiResponseParser');
const fs = require('fs');

// Load the saved API response
const specsData = JSON.parse(fs.readFileSync('api-response-vehiclespecs.json', 'utf8'));

console.log('='.repeat(70));
console.log('TEST: Fresh Parser Test');
console.log('='.repeat(70));
console.log();

console.log('Parsing API response...');
const parsed = ApiResponseParser.parseCheckCarDetailsResponse(specsData);

console.log();
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

if (parsed.combinedMpg === 47.9 && parsed.co2Emissions === 156) {
  console.log('🎉 SUCCESS: Parser is working correctly!');
  console.log();
  console.log('Running costs will now show on frontend!');
} else {
  console.log('❌ Still not working');
  console.log('Actual:', parsed.combinedMpg, parsed.co2Emissions);
}
