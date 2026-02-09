/**
 * Test: Debug parser to see what's happening
 */

const fs = require('fs');

// Load the saved API response
const specsData = JSON.parse(fs.readFileSync('api-response-vehiclespecs.json', 'utf8'));

console.log('='.repeat(70));
console.log('DEBUG: Parser Input Data');
console.log('='.repeat(70));
console.log();

console.log('Checking SmmtDetails in API response...');
console.log();

if (specsData.SmmtDetails) {
  console.log('✅ SmmtDetails EXISTS');
  console.log();
  console.log('SmmtDetails.UrbanColdMpg:', specsData.SmmtDetails.UrbanColdMpg);
  console.log('SmmtDetails.ExtraUrbanMpg:', specsData.SmmtDetails.ExtraUrbanMpg);
  console.log('SmmtDetails.CombinedMpg:', specsData.SmmtDetails.CombinedMpg);
  console.log('SmmtDetails.Co2:', specsData.SmmtDetails.Co2);
  console.log('SmmtDetails.InsuranceGroup:', specsData.SmmtDetails.InsuranceGroup);
  console.log();
  
  // Test extractNumber function
  function extractNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }
  
  console.log('Testing extractNumber function:');
  console.log('extractNumber(37.2):', extractNumber(37.2));
  console.log('extractNumber(specsData.SmmtDetails.UrbanColdMpg):', extractNumber(specsData.SmmtDetails.UrbanColdMpg));
  console.log('extractNumber(specsData.SmmtDetails.CombinedMpg):', extractNumber(specsData.SmmtDetails.CombinedMpg));
  console.log('extractNumber(specsData.SmmtDetails.Co2):', extractNumber(specsData.SmmtDetails.Co2));
  
} else {
  console.log('❌ SmmtDetails MISSING');
}

console.log();
console.log('Checking other possible locations...');
console.log('- ModelData:', specsData.ModelData ? 'EXISTS' : 'MISSING');
console.log('- Performance:', specsData.Performance ? 'EXISTS' : 'MISSING');
console.log('- Emissions:', specsData.Emissions ? 'EXISTS' : 'MISSING');
