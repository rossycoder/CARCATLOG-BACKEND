// Test the extractTownName logic

function extractTownName(locationName) {
  if (!locationName) return '';
  
  // Split by comma to get parts
  const parts = locationName.split(',').map(part => part.trim());
  
  // Remove parts that look like postcodes (e.g., SS11TH, SS1 1TH)
  // Remove descriptive parts like "unparished area"
  const cleanParts = parts.filter(part => {
    // Skip if it looks like a postcode (alphanumeric with optional space)
    if (/^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i.test(part)) {
      return false;
    }
    // Skip if it's just a postcode without space (e.g., SS11TH)
    if (/^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/i.test(part)) {
      return false;
    }
    // Skip descriptive terms
    if (part.toLowerCase().includes('unparished area')) {
      return false;
    }
    return true;
  });
  
  // Return the first clean part (usually the town/city name)
  return cleanParts[0] || locationName;
}

// Test cases
const testCases = [
  'Manchester, unparished area',
  'Manchester, unparished area, M1 1AE',
  'London, Greater London',
  'Birmingham, West Midlands, B1 1AA',
  'Leeds',
  'Southend-on-Sea, unparished area, SS1 1TH'
];

console.log('Testing extractTownName function:\n');
testCases.forEach(test => {
  const result = extractTownName(test);
  console.log(`Input:  "${test}"`);
  console.log(`Output: "${result}"`);
  console.log('---');
});
