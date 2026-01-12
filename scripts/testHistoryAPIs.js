require('dotenv').config();
const axios = require('axios');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test registration numbers
const TEST_REGISTRATIONS = {
  valid: 'BD51SMR', // Known valid UK registration
  testMode: 'AA19AAA' // Contains 'A' for test mode
};

console.log(`${colors.cyan}========================================`);
console.log(`VEHICLE HISTORY & MOT API TEST`);
console.log(`========================================${colors.reset}\n`);

// Test results storage
const results = {
  vehicleHistory_live: { status: 'PENDING', message: '', endpoint: '', key: '' },
  vehicleHistory_test: { status: 'PENDING', message: '', endpoint: '', key: '' },
  motHistory_live: { status: 'PENDING', message: '', endpoint: '', key: '' },
  motHistory_test: { status: 'PENDING', message: '', endpoint: '', key: '' }
};

// Test Vehicle History API (Live)
async function testVehicleHistoryLive() {
  console.log(`${colors.blue}Testing Vehicle History API (Live Key)...${colors.reset}`);
  
  const apiKey = process.env.HISTORY_API_LIVE_KEY;
  const baseUrl = process.env.HISTORY_API_BASE_URL || 'https://checkcardetails.co.uk';
  const endpoint = `${baseUrl}/vehicledata/carhistorycheck`;
  
  results.vehicleHistory_live.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  results.vehicleHistory_live.endpoint = endpoint;
  
  if (!apiKey) {
    results.vehicleHistory_live.status = 'FAILED';
    results.vehicleHistory_live.message = 'API key not configured';
    return;
  }

  try {
    console.log(`  Endpoint: ${endpoint}`);
    console.log(`  VRM: ${TEST_REGISTRATIONS.valid}`);
    
    const response = await axios.get(endpoint, {
      params: {
        apikey: apiKey,
        vrm: TEST_REGISTRATIONS.valid
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data) {
      results.vehicleHistory_live.status = 'SUCCESS';
      results.vehicleHistory_live.message = `Vehicle history retrieved successfully`;
      console.log(`  ${colors.green}✓ Success${colors.reset}`);
    }
  } catch (error) {
    results.vehicleHistory_live.status = 'FAILED';
    if (error.response) {
      results.vehicleHistory_live.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      console.log(`  ${colors.red}✗ HTTP ${error.response.status}${colors.reset}`);
    } else if (error.code === 'ECONNABORTED') {
      results.vehicleHistory_live.message = 'Request timeout';
      console.log(`  ${colors.red}✗ Timeout${colors.reset}`);
    } else {
      results.vehicleHistory_live.message = error.message;
      console.log(`  ${colors.red}✗ ${error.message}${colors.reset}`);
    }
  }
}

// Test Vehicle History API (Test)
async function testVehicleHistoryTest() {
  console.log(`${colors.blue}Testing Vehicle History API (Test Key)...${colors.reset}`);
  
  const apiKey = process.env.HISTORY_API_TEST_KEY;
  const baseUrl = process.env.HISTORY_API_TEST_BASE_URL || 'https://checkcardetails.co.uk';
  const endpoint = `${baseUrl}/vehicledata/carhistorycheck`;
  
  results.vehicleHistory_test.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  results.vehicleHistory_test.endpoint = endpoint;
  
  if (!apiKey) {
    results.vehicleHistory_test.status = 'FAILED';
    results.vehicleHistory_test.message = 'API key not configured';
    return;
  }

  try {
    console.log(`  Endpoint: ${endpoint}`);
    console.log(`  VRM: ${TEST_REGISTRATIONS.testMode} (test mode - contains 'A')`);
    
    const response = await axios.get(endpoint, {
      params: {
        apikey: apiKey,
        vrm: TEST_REGISTRATIONS.testMode
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data) {
      results.vehicleHistory_test.status = 'SUCCESS';
      results.vehicleHistory_test.message = `Test vehicle history retrieved successfully`;
      console.log(`  ${colors.green}✓ Success${colors.reset}`);
    }
  } catch (error) {
    results.vehicleHistory_test.status = 'FAILED';
    if (error.response) {
      results.vehicleHistory_test.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      console.log(`  ${colors.red}✗ HTTP ${error.response.status}${colors.reset}`);
    } else if (error.code === 'ECONNABORTED') {
      results.vehicleHistory_test.message = 'Request timeout';
      console.log(`  ${colors.red}✗ Timeout${colors.reset}`);
    } else {
      results.vehicleHistory_test.message = error.message;
      console.log(`  ${colors.red}✗ ${error.message}${colors.reset}`);
    }
  }
}

// Test MOT History API (Live)
async function testMOTHistoryLive() {
  console.log(`${colors.blue}Testing MOT History API (Live Key)...${colors.reset}`);
  
  const apiKey = process.env.HISTORY_API_LIVE_KEY;
  const baseUrl = process.env.HISTORY_API_BASE_URL || 'https://checkcardetails.co.uk';
  const endpoint = `${baseUrl}/vehicledata/mothistory`;
  
  results.motHistory_live.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  results.motHistory_live.endpoint = endpoint;
  
  if (!apiKey) {
    results.motHistory_live.status = 'FAILED';
    results.motHistory_live.message = 'API key not configured';
    return;
  }

  try {
    console.log(`  Endpoint: ${endpoint}`);
    console.log(`  VRM: ${TEST_REGISTRATIONS.valid}`);
    
    const response = await axios.get(endpoint, {
      params: {
        apikey: apiKey,
        vrm: TEST_REGISTRATIONS.valid
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data) {
      results.motHistory_live.status = 'SUCCESS';
      results.motHistory_live.message = `MOT history retrieved successfully`;
      console.log(`  ${colors.green}✓ Success${colors.reset}`);
    }
  } catch (error) {
    results.motHistory_live.status = 'FAILED';
    if (error.response) {
      results.motHistory_live.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      console.log(`  ${colors.red}✗ HTTP ${error.response.status}${colors.reset}`);
    } else if (error.code === 'ECONNABORTED') {
      results.motHistory_live.message = 'Request timeout';
      console.log(`  ${colors.red}✗ Timeout${colors.reset}`);
    } else {
      results.motHistory_live.message = error.message;
      console.log(`  ${colors.red}✗ ${error.message}${colors.reset}`);
    }
  }
}

// Test MOT History API (Test)
async function testMOTHistoryTest() {
  console.log(`${colors.blue}Testing MOT History API (Test Key)...${colors.reset}`);
  
  const apiKey = process.env.HISTORY_API_TEST_KEY;
  const baseUrl = process.env.HISTORY_API_TEST_BASE_URL || 'https://checkcardetails.co.uk';
  const endpoint = `${baseUrl}/vehicledata/mothistory`;
  
  results.motHistory_test.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  results.motHistory_test.endpoint = endpoint;
  
  if (!apiKey) {
    results.motHistory_test.status = 'FAILED';
    results.motHistory_test.message = 'API key not configured';
    return;
  }

  try {
    console.log(`  Endpoint: ${endpoint}`);
    console.log(`  VRM: ${TEST_REGISTRATIONS.testMode} (test mode - contains 'A')`);
    
    const response = await axios.get(endpoint, {
      params: {
        apikey: apiKey,
        vrm: TEST_REGISTRATIONS.testMode
      },
      timeout: 10000
    });

    if (response.status === 200 && response.data) {
      results.motHistory_test.status = 'SUCCESS';
      results.motHistory_test.message = `Test MOT history retrieved successfully`;
      console.log(`  ${colors.green}✓ Success${colors.reset}`);
    }
  } catch (error) {
    results.motHistory_test.status = 'FAILED';
    if (error.response) {
      results.motHistory_test.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      console.log(`  ${colors.red}✗ HTTP ${error.response.status}${colors.reset}`);
    } else if (error.code === 'ECONNABORTED') {
      results.motHistory_test.message = 'Request timeout';
      console.log(`  ${colors.red}✗ Timeout${colors.reset}`);
    } else {
      results.motHistory_test.message = error.message;
      console.log(`  ${colors.red}✗ ${error.message}${colors.reset}`);
    }
  }
}

// Print results
function printResults() {
  console.log(`\n${colors.cyan}========================================`);
  console.log(`TEST RESULTS`);
  console.log(`========================================${colors.reset}\n`);

  console.log(`${colors.yellow}VEHICLE HISTORY API:${colors.reset}\n`);
  
  // Vehicle History Live
  const vhLiveColor = results.vehicleHistory_live.status === 'SUCCESS' ? colors.green : colors.red;
  const vhLiveIcon = results.vehicleHistory_live.status === 'SUCCESS' ? '✓' : '✗';
  console.log(`${vhLiveColor}${vhLiveIcon} Live Key${colors.reset}`);
  console.log(`  Key: ${results.vehicleHistory_live.key}`);
  console.log(`  Endpoint: ${results.vehicleHistory_live.endpoint}`);
  console.log(`  Status: ${results.vehicleHistory_live.status}`);
  console.log(`  Message: ${results.vehicleHistory_live.message}\n`);

  // Vehicle History Test
  const vhTestColor = results.vehicleHistory_test.status === 'SUCCESS' ? colors.green : colors.red;
  const vhTestIcon = results.vehicleHistory_test.status === 'SUCCESS' ? '✓' : '✗';
  console.log(`${vhTestColor}${vhTestIcon} Test Key${colors.reset}`);
  console.log(`  Key: ${results.vehicleHistory_test.key}`);
  console.log(`  Endpoint: ${results.vehicleHistory_test.endpoint}`);
  console.log(`  Status: ${results.vehicleHistory_test.status}`);
  console.log(`  Message: ${results.vehicleHistory_test.message}\n`);

  console.log(`${colors.yellow}MOT HISTORY API:${colors.reset}\n`);
  
  // MOT History Live
  const motLiveColor = results.motHistory_live.status === 'SUCCESS' ? colors.green : colors.red;
  const motLiveIcon = results.motHistory_live.status === 'SUCCESS' ? '✓' : '✗';
  console.log(`${motLiveColor}${motLiveIcon} Live Key${colors.reset}`);
  console.log(`  Key: ${results.motHistory_live.key}`);
  console.log(`  Endpoint: ${results.motHistory_live.endpoint}`);
  console.log(`  Status: ${results.motHistory_live.status}`);
  console.log(`  Message: ${results.motHistory_live.message}\n`);

  // MOT History Test
  const motTestColor = results.motHistory_test.status === 'SUCCESS' ? colors.green : colors.red;
  const motTestIcon = results.motHistory_test.status === 'SUCCESS' ? '✓' : '✗';
  console.log(`${motTestColor}${motTestIcon} Test Key${colors.reset}`);
  console.log(`  Key: ${results.motHistory_test.key}`);
  console.log(`  Endpoint: ${results.motHistory_test.endpoint}`);
  console.log(`  Status: ${results.motHistory_test.status}`);
  console.log(`  Message: ${results.motHistory_test.message}\n`);

  // Summary
  const successCount = Object.values(results).filter(r => r.status === 'SUCCESS').length;
  const totalCount = Object.keys(results).length;
  
  console.log(`${colors.cyan}========================================`);
  console.log(`SUMMARY: ${successCount}/${totalCount} APIs Working`);
  console.log(`========================================${colors.reset}\n`);

  // Recommendations
  if (successCount === 0) {
    console.log(`${colors.red}❌ ALL HISTORY APIs FAILED${colors.reset}\n`);
    console.log(`${colors.yellow}ISSUE: API keys are returning 403 Forbidden${colors.reset}`);
    console.log(`This means the API keys are invalid or expired.\n`);
    console.log(`${colors.yellow}ACTION REQUIRED:${colors.reset}`);
    console.log(`1. Contact CheckCard support at https://checkcardetails.co.uk`);
    console.log(`2. Verify your API keys are active`);
    console.log(`3. Request new API keys if needed`);
    console.log(`4. Check if IP whitelisting is required\n`);
  } else if (successCount < totalCount) {
    console.log(`${colors.yellow}⚠ PARTIAL SUCCESS${colors.reset}\n`);
    console.log(`Some APIs are working, but not all.`);
    console.log(`Check the failed APIs above for details.\n`);
  } else {
    console.log(`${colors.green}✓ ALL HISTORY APIs WORKING!${colors.reset}\n`);
    console.log(`Your vehicle history and MOT history integrations are functional.\n`);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testVehicleHistoryLive();
    await testVehicleHistoryTest();
    await testMOTHistoryLive();
    await testMOTHistoryTest();
    
    printResults();
  } catch (error) {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error.message);
  }
}

// Execute
runAllTests();
