const { parseHistoryResponse } = require('../utils/historyResponseParser');

// Simulate API response structure
const mockAPIResponse = {
    VehicleRegistration: {
        Vrm: 'AB12CDE',
        Make: 'VAUXHALL',
        Model: 'ASTRA SRI TURBO',
        Colour: 'WHITE',
        FuelType: 'PETROL'
    },
    VehicleHistory: {
        NumberOfPreviousKeepers: 1,
        KeeperChangesCount: 1
    }
};

console.log('='.repeat(60));
console.log('Testing Parser Directly');
console.log('='.repeat(60));

console.log('\n📦 INPUT (Mock API Response):');
console.log(JSON.stringify(mockAPIResponse, null, 2));

console.log('\n🔄 PARSING...');
const result = parseHistoryResponse(mockAPIResponse);

console.log('\n📊 OUTPUT (Parsed Result):');
console.log(JSON.stringify(result, null, 2));

console.log('\n🔍 KEY FIELDS:');
console.log('previousOwners:', result.previousOwners);
console.log('numberOfOwners:', result.numberOfOwners);
