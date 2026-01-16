/**
 * Test Valuation Parser with actual API response format
 */

const { parseValuationResponse, handlePartialValuationResponse } = require('../utils/valuationResponseParser');

// Actual API response format from CheckCarDetails
const actualAPIResponse = {
  Vrm: 'EK14TWX',
  Mileage: '50,000',
  ValuationList: {
    DealerForecourt: '27553',
    TradeAverage: '17675',
    PrivateClean: '22409',
    PartExchange: '15800'
  },
  ValuationTime: '2026-01-15T21:03:35.8803027Z',
  VehicleDescription: 'BMW M6 Gran Coupe Auto M6 Gran Coupe [Petrol / Automatic]'
};

console.log('Testing Valuation Parser with actual API response format\n');
console.log('Input:', JSON.stringify(actualAPIResponse, null, 2));

try {
  const parsed = parseValuationResponse(actualAPIResponse, false);
  console.log('\n✅ Parse SUCCESS!');
  console.log('\nParsed Result:', JSON.stringify(parsed, null, 2));
} catch (error) {
  console.log('\n❌ Parse FAILED!');
  console.log('Error:', error.message);
  console.log('Missing fields:', error.missingFields);
  
  console.log('\nTrying partial parse...');
  try {
    const partialParsed = handlePartialValuationResponse(actualAPIResponse, false);
    console.log('\n✅ Partial Parse SUCCESS!');
    console.log('\nPartial Parsed Result:', JSON.stringify(partialParsed, null, 2));
  } catch (partialError) {
    console.log('\n❌ Partial Parse ALSO FAILED!');
    console.log('Error:', partialError.message);
  }
}
