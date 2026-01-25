/**
 * Test Parser Fix Directly
 * Tests the historyResponseParser with sample data
 */

const { parseHistoryResponse } = require('../utils/historyResponseParser');

// Sample API response for EX09MYY (Cat D write-off)
const sampleResponse = {
  VehicleRegistration: {
    Vrm: 'EX09MYY',
    Make: 'HONDA',
    Model: 'CIVIC TYPE S I-VTEC',
    Scrapped: false,
    Imported: false,
    Exported: false,
  },
  VehicleHistory: {
    NumberOfPreviousKeepers: 5,
    writeOffRecord: true,
    writeoff: {
      status: 'CAT D VEHICLE DAMAGED',
      lossdate: '2016-12-19',
      category: 'D',
    },
    stolenRecord: false,
    financeRecord: false,
  },
};

console.log('🧪 Testing Parser with Sample Data\n');
console.log('Input:', JSON.stringify(sampleResponse, null, 2));
console.log('\n' + '='.repeat(80) + '\n');

try {
  const result = parseHistoryResponse(sampleResponse, false);
  console.log('✅ Parser Success!');
  console.log('\nParsed Result:');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Key Fields Check:');
  console.log('  hasAccidentHistory:', result.hasAccidentHistory);
  console.log('  isWrittenOff:', result.isWrittenOff);
  console.log('  accidentDetails:', result.accidentDetails);
  console.log('  stolenDetails:', result.stolenDetails);
  console.log('  financeDetails:', result.financeDetails);
  
  if (!result.stolenDetails) {
    console.log('\n❌ ERROR: stolenDetails is missing!');
  }
  if (!result.financeDetails) {
    console.log('\n❌ ERROR: financeDetails is missing!');
  }
  
  if (result.stolenDetails && result.financeDetails) {
    console.log('\n✅ All required fields present!');
  }
} catch (error) {
  console.error('❌ Parser Error:', error.message);
  console.error(error.stack);
}
