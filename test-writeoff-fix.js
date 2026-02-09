/**
 * Test script to verify write-off category parsing fix
 * Tests that Category N write-offs are correctly parsed and stored
 */

const { parseHistoryResponse } = require('./utils/historyResponseParser');

// Mock API response with Category N write-off (like the real API returns)
const mockApiResponse = {
  VehicleRegistration: {
    Vrm: 'TEST123',
    Make: 'VOLKSWAGEN',
    Model: 'GOLF',
    Scrapped: false,
    Imported: false,
    Exported: false
  },
  VehicleHistory: {
    NumberOfPreviousKeepers: 2,
    writeOffRecord: true,
    writeoff: {
      category: 'N',
      status: 'CAT N VEHICLE DAMAGED',
      lossdate: '2020-05-15'
    },
    stolenRecord: false,
    financeRecord: false,
    V5CCertificateCount: 1,
    PlateChangeCount: 0,
    ColourChangeCount: 0,
    VicCount: 0
  }
};

console.log('Testing write-off category parsing...\n');
console.log('Mock API Response:');
console.log(JSON.stringify(mockApiResponse.VehicleHistory.writeoff, null, 2));
console.log('\n---\n');

// Parse the response
const parsedResult = parseHistoryResponse(mockApiResponse, false);

console.log('Parsed Result:');
console.log('- writeOffCategory:', parsedResult.writeOffCategory);
console.log('- isWrittenOff:', parsedResult.isWrittenOff);
console.log('- writeOffDetails:', JSON.stringify(parsedResult.writeOffDetails, null, 2));
console.log('- accidentDetails:', JSON.stringify(parsedResult.accidentDetails, null, 2));

// Verify the fix
console.log('\n---\n');
if (parsedResult.writeOffCategory === 'N') {
  console.log('✅ SUCCESS: Write-off category correctly parsed as "N"');
} else {
  console.log(`❌ FAILED: Expected "N" but got "${parsedResult.writeOffCategory}"`);
}

if (parsedResult.isWrittenOff === true) {
  console.log('✅ SUCCESS: isWrittenOff correctly set to true');
} else {
  console.log('❌ FAILED: isWrittenOff should be true');
}

if (parsedResult.writeOffDetails.category === 'N') {
  console.log('✅ SUCCESS: writeOffDetails.category correctly set to "N"');
} else {
  console.log(`❌ FAILED: writeOffDetails.category expected "N" but got "${parsedResult.writeOffDetails.category}"`);
}

console.log('\n---\n');
console.log('Test complete!');
