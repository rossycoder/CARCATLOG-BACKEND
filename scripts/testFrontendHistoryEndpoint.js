/**
 * Test the actual history endpoint that frontend calls
 * Check what data frontend receives
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test vehicles - mix of clean and problematic
const testVehicles = [
  { vrm: 'AB12CDE', expected: 'Clean' },
  { vrm: 'MX08XMT', expected: 'Write-off (Cat D)' },
  { vrm: 'EX09MYY', expected: 'Write-off (Cat D)' }
];

async function testHistoryEndpoint() {
  console.log('🧪 Testing Frontend History Endpoint\n');
  console.log('Make sure backend server is running on port 5000!\n');
  console.log('='.repeat(80));

  for (const vehicle of testVehicles) {
    console.log(`\n🚗 Testing: ${vehicle.vrm} (Expected: ${vehicle.expected})`);
    console.log('-'.repeat(80));

    try {
      // First, trigger a fresh check (POST)
      console.log('  Triggering fresh API check...');
      await axios.post(`${BASE_URL}/api/vehicle-history/check`, { vrm: vehicle.vrm });
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then get the result (GET)
      const response = await axios.get(`${BASE_URL}/api/vehicle-history/${vehicle.vrm}`);
      const data = response.data.data || response.data;

      console.log('\n📊 Response Data:');
      console.log(JSON.stringify(data, null, 2));

      // Check what frontend will see
      console.log('\n🔍 Frontend Logic Check:');
      console.log(`  isStolen: ${data.isStolen}`);
      console.log(`  isScrapped: ${data.isScrapped}`);
      console.log(`  isImported: ${data.isImported}`);
      console.log(`  isExported: ${data.isExported}`);
      console.log(`  hasAccidentHistory: ${data.hasAccidentHistory}`);
      console.log(`  isWrittenOff: ${data.isWrittenOff}`);
      console.log(`  accidentDetails:`, data.accidentDetails);

      // Simulate frontend write-off check
      const writeOffCheckPassed = !(
        data.hasAccidentHistory === true || 
        data.isWrittenOff === true || 
        (data.accidentDetails?.severity && data.accidentDetails.severity !== 'unknown')
      );

      console.log('\n🎯 Frontend Display:');
      console.log(`  Write-off check: ${writeOffCheckPassed ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (!writeOffCheckPassed) {
        if (data.accidentDetails?.severity && data.accidentDetails.severity !== 'unknown') {
          console.log(`  Message: "Recorded as Category ${data.accidentDetails.severity} (insurance write-off)"`);
        } else {
          console.log(`  Message: "This vehicle has been recorded as written off or has accident history."`);
        }
      }

      // Verify against expected
      const isCorrect = (vehicle.expected === 'Clean' && writeOffCheckPassed) ||
                       (vehicle.expected.includes('Write-off') && !writeOffCheckPassed);
      
      console.log(`\n${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'} - Matches expected result`);

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('\n❌ Backend server is not running!');
        console.log('   Start it with: cd backend && npm start');
        break;
      } else {
        console.log(`\n❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Data:`, error.response.data);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 SUMMARY');
  console.log('='.repeat(80));
  console.log('If write-off checks are passing for vehicles that should fail:');
  console.log('1. Check backend parser (historyResponseParser.js)');
  console.log('2. Check history service (historyService.js)');
  console.log('3. Check frontend logic (VehicleHistorySection.jsx)');
  console.log('\nIf all checks show correct results, the system is working properly!');
}

testHistoryEndpoint();
