/**
 * Test script to verify valuation parsing with string values
 */

const { parseValuationResponse } = require('../utils/valuationResponseParser');

// Test with the actual API response format (values as strings with commas)
const apiResponse = {
  "Vrm": "NU10YEV",
  "Mileage": "50,000",
  "ValuationList": {
    "OTR": "14690",
    "DealerForecourt": "3503",
    "TradeRetail": "3163",
    "PrivateClean": "2644",
    "PrivateAverage": "2458",
    "PartExchange": "2522",
    "Auction": "1934",
    "TradeAverage": "1748",
    "TradePoor": "1457"
  },
  "ValuationTime": "2026-01-26T15:21:05.1913869Z",
  "VehicleDescription": "Skoda Octavia S TDI CR S TDI CR [Diesel / Manual]"
};

console.log('Testing valuation parsing with string values...\n');
console.log('Input API Response:');
console.log(JSON.stringify(apiResponse, null, 2));

try {
  const parsed = parseValuationResponse(apiResponse);
  
  console.log('\n✅ Parsed Result:');
  console.log(JSON.stringify(parsed, null, 2));
  
  console.log('\n📊 Valuation Values (should be numbers):');
  console.log(`  Retail: £${parsed.estimatedValue.retail} (type: ${typeof parsed.estimatedValue.retail})`);
  console.log(`  Trade: £${parsed.estimatedValue.trade} (type: ${typeof parsed.estimatedValue.trade})`);
  console.log(`  Private: £${parsed.estimatedValue.private} (type: ${typeof parsed.estimatedValue.private})`);
  console.log(`  Mileage: ${parsed.mileage} (type: ${typeof parsed.mileage})`);
  
  // Verify all values are numbers and greater than 1000
  const allValid = 
    typeof parsed.estimatedValue.retail === 'number' &&
    typeof parsed.estimatedValue.trade === 'number' &&
    typeof parsed.estimatedValue.private === 'number' &&
    typeof parsed.mileage === 'number' &&
    parsed.estimatedValue.retail > 1000 &&
    parsed.estimatedValue.trade > 1000 &&
    parsed.estimatedValue.private > 1000;
  
  if (allValid) {
    console.log('\n✅ SUCCESS: All values parsed correctly as numbers!');
  } else {
    console.log('\n❌ FAILURE: Some values are not parsed correctly');
  }
  
} catch (error) {
  console.error('\n❌ Error parsing response:', error.message);
  console.error(error);
}
