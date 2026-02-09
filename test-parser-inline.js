/**
 * Test: Inline parser test to debug
 */

const fs = require('fs');

// Load the saved API response
const data = JSON.parse(fs.readFileSync('api-response-vehiclespecs.json', 'utf8'));

console.log('Testing inline parsing...\n');

// Extract objects
const vehicleId = data.VehicleIdentification || {};
const bodyDetails = data.BodyDetails || {};
const performance = data.Performance || {};
const fuelEconomy = performance.FuelEconomy || {};
const modelData = data.ModelData || {};
const transmission = data.Transmission || {};
const dvlaTech = data.DvlaTechnicalDetails || {};
const emissions = data.Emissions || {};
const smmtDetails = data.SmmtDetails || {};

console.log('Objects extracted:');
console.log('- smmtDetails:', !!smmtDetails);
console.log('- smmtDetails.UrbanColdMpg:', smmtDetails.UrbanColdMpg);
console.log('- smmtDetails.CombinedMpg:', smmtDetails.CombinedMpg);
console.log('- smmtDetails.Co2:', smmtDetails.Co2);
console.log();

// extractNumber function
function extractNumber(value) {
  console.log(`  extractNumber called with: ${value} (type: ${typeof value})`);
  if (value === null || value === undefined || value === '') {
    console.log(`  -> returning null (empty value)`);
    return null;
  }
  if (typeof value === 'number') {
    console.log(`  -> returning ${value} (already number)`);
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    const result = isNaN(parsed) ? null : parsed;
    console.log(`  -> returning ${result} (parsed from string)`);
    return result;
  }
  console.log(`  -> returning null (unknown type)`);
  return null;
}

console.log('Testing extractNumber:');
const urbanMpg = extractNumber(smmtDetails.UrbanColdMpg || fuelEconomy.UrbanColdMpg);
console.log('Result urbanMpg:', urbanMpg);
console.log();

const combinedMpg = extractNumber(smmtDetails.CombinedMpg || fuelEconomy.CombinedMpg);
console.log('Result combinedMpg:', combinedMpg);
console.log();

const co2 = extractNumber(smmtDetails.Co2 || emissions.ManufacturerCo2 || vehicleId.DvlaCo2);
console.log('Result co2:', co2);
