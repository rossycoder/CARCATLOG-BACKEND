/**
 * Test CheckCarDetails API Integration
 * Tests all available data points with the live API key
 */

const axios = require('axios');

// CheckCarDetails API Configuration
const API_KEY = '14cedd96eeda4ac6b6b7f9a4db04f573';
const BASE_URL = 'https://api.checkcardetails.co.uk';

// Test VRM (must contain 'A' for test API key)
const TEST_VRM = 'AB12CDE'; // Example VRM with 'A'

// Data points to test
const dataPoints = [
  { name: 'vehicleregistration', cost: 0.02 },
  { name: 'ukvehicledata', cost: 0.10 },
  { name: 'vehiclespecs', cost: 0.04 },
  { name: 'carhistorycheck', cost: 1.82 },
  { name: 'mot', cost: 0.02 },
  { name: 'mileage', cost: 0.02 },
  { name: 'vehicleimage', cost: 0.05 },
  { name: 'vehiclevaluation', cost: 0.12 }
];

/**
 * Test a single data point
 */
async function testDataPoint(dataPoint, vrm) {
  const url = `${BASE_URL}/vehicledata/${dataPoint.name}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${dataPoint.name} (£${dataPoint.cost})`);
  console.log(`URL: ${url}?apikey=${API_KEY}&vrm=${vrm}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      params: {
        apikey: API_KEY,
        vrm: vrm
      },
      timeout: 15000
    });

    const responseTime = Date.now() - startTime;

    console.log(`✓ SUCCESS (${responseTime}ms)`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response Data:`);
    console.log(JSON.stringify(response.data, null, 2));

    return {
      dataPoint: dataPoint.name,
      success: true,
      responseTime,
      status: response.status,
      data: response.data
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.log(`✗ FAILED (${responseTime}ms)`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`Error Data:`, error.response.data);
      
      return {
        dataPoint: dataPoint.name,
        success: false,
        responseTime,
        status: error.response.status,
        error: error.response.data
      };
    } else {
      console.log(`Error: ${error.message}`);
      
      return {
        dataPoint: dataPoint.name,
        success: false,
        responseTime,
        error: error.message
      };
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('CheckCarDetails API Integration Test');
  console.log('='.repeat(60));
  console.log(`API Key: ${API_KEY}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test VRM: ${TEST_VRM}`);
  console.log(`Total Data Points: ${dataPoints.length}`);
  console.log('='.repeat(60));

  const results = [];

  // Test each data point sequentially
  for (const dataPoint of dataPoints) {
    const result = await testDataPoint(dataPoint, TEST_VRM);
    results.push(result);
    
    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✓ Successful: ${successful.length}`);
  console.log(`✗ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log(`\n✓ Successful Data Points:`);
    successful.forEach(r => {
      console.log(`  - ${r.dataPoint} (${r.responseTime}ms)`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n✗ Failed Data Points:`);
    failed.forEach(r => {
      console.log(`  - ${r.dataPoint} (${r.status || 'N/A'}): ${r.error?.message || r.error || 'Unknown error'}`);
    });
  }

  // Calculate total cost
  const totalCost = dataPoints.reduce((sum, dp) => sum + dp.cost, 0);
  console.log(`\nTotal API Cost (if all succeed): £${totalCost.toFixed(2)}`);

  console.log('\n' + '='.repeat(60));
}

// Run the tests
runTests().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
