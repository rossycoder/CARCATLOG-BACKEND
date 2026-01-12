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
console.log(`API KEY VALIDATION TEST`);
console.log(`========================================${colors.reset}\n`);

// Test results storage
const results = {
  dvla: { status: 'PENDING', message: '', key: '' },
  checkcard_live: { status: 'PENDING', message: '', key: '' },
  checkcard_test: { status: 'PENDING', message: '', key: '' },
  history_live: { status: 'PENDING', message: '', key: '' },
  history_test: { status: 'PENDING', message: '', key: '' },
  valuation_live: { status: 'PENDING', message: '', key: '' },
  valuation_test: { status: 'PENDING', message: '', key: '' }
};

// Test DVLA API
async function testDVLAAPI() {
  console.log(`${colors.blue}Testing DVLA API...${colors.reset}`);
  
  const apiKey = process.env.DVLA_API_KEY;
  results.dvla.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  
  if (!apiKey) {
    results.dvla.status = 'FAILED';
    results.dvla.message = 'API key not configured';
    return;
  }

  try {
    const response = await axios.post(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      { registrationNumber: TEST_REGISTRATIONS.valid },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data) {
      results.dvla.status = 'SUCCESS';
      results.dvla.message = `Vehicle found: ${response.data.make} ${response.data.model}`;
    }
  } catch (error) {
    results.dvla.status = 'FAILED';
    if (error.response) {
      results.dvla.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
    } else if (error.code === 'ECONNABORTED') {
      results.dvla.message = 'Request timeout';
    } else {
      results.dvla.message = error.message;
    }
  }
}

// Test CheckCard API (Live)
async function testCheckCardLive() {
  console.log(`${colors.blue}Testing CheckCard API (Live Key)...${colors.reset}`);
  
  const apiKey = process.env.CHECKCARD_API_KEY;
  results.checkcard_live.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  
  if (!apiKey) {
    results.checkcard_live.status = 'FAILED';
    results.checkcard_live.message = 'API key not configured';
    return;
  }

  // Try multiple URL variations
  const urls = [
    `https://checkcardetails.co.uk/vehicledata/history?apikey=${apiKey}&vrm=${TEST_REGISTRATIONS.valid}`,
    `https://www.checkcardetails.co.uk/vehicledata/history?apikey=${apiKey}&vrm=${TEST_REGISTRATIONS.valid}`,
    `https://api.checkcardetails.co.uk/vehicledata/history?apikey=${apiKey}&vrm=${TEST_REGISTRATIONS.valid}`
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, { timeout: 10000 });

      if (response.status === 200 && response.data) {
        results.checkcard_live.status = 'SUCCESS';
        results.checkcard_live.message = `Data retrieved from ${url.split('/')[2]}`;
        return;
      }
    } catch (error) {
      // Continue to next URL
      continue;
    }
  }

  results.checkcard_live.status = 'FAILED';
  results.checkcard_live.message = 'All URL variations failed (403 Forbidden or DNS error)';
}

// Test CheckCard API (Test)
async function testCheckCardTest() {
  console.log(`${colors.blue}Testing CheckCard API (Test Key)...${colors.reset}`);
  
  const apiKey = process.env.CHECKCARD_API_TEST_KEY;
  results.checkcard_test.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  
  if (!apiKey) {
    results.checkcard_test.status = 'FAILED';
    results.checkcard_test.message = 'API key not configured';
    return;
  }

  try {
    const response = await axios.get(
      `https://checkcardetails.co.uk/vehicledata/history`,
      {
        params: {
          apikey: apiKey,
          vrm: TEST_REGISTRATIONS.testMode
        },
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data) {
      results.checkcard_test.status = 'SUCCESS';
      results.checkcard_test.message = `Test data retrieved successfully`;
    }
  } catch (error) {
    results.checkcard_test.status = 'FAILED';
    if (error.response) {
      results.checkcard_test.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
    } else {
      results.checkcard_test.message = error.message;
    }
  }
}

// Test History API (Live)
async function testHistoryLive() {
  console.log(`${colors.blue}Testing History API (Live Key)...${colors.reset}`);
  
  const apiKey = process.env.HISTORY_API_LIVE_KEY;
  const baseUrl = process.env.HISTORY_API_BASE_URL || 'https://checkcardetails.co.uk';
  results.history_live.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  
  if (!apiKey) {
    results.history_live.status = 'FAILED';
    results.history_live.message = 'API key not configured';
    return;
  }

  try {
    const response = await axios.get(
      `${baseUrl}/vehicledata/history`,
      {
        params: {
          apikey: apiKey,
          vrm: TEST_REGISTRATIONS.valid
        },
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data) {
      results.history_live.status = 'SUCCESS';
      results.history_live.message = `History data retrieved from ${baseUrl}`;
    }
  } catch (error) {
    results.history_live.status = 'FAILED';
    if (error.response) {
      results.history_live.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
    } else {
      results.history_live.message = error.message;
    }
  }
}

// Test History API (Test)
async function testHistoryTest() {
  console.log(`${colors.blue}Testing History API (Test Key)...${colors.reset}`);
  
  const apiKey = process.env.HISTORY_API_TEST_KEY;
  const baseUrl = process.env.HISTORY_API_TEST_BASE_URL || 'https://checkcardetails.co.uk';
  results.history_test.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  
  if (!apiKey) {
    results.history_test.status = 'FAILED';
    results.history_test.message = 'API key not configured';
    return;
  }

  try {
    const response = await axios.get(
      `${baseUrl}/vehicledata/history`,
      {
        params: {
          apikey: apiKey,
          vrm: TEST_REGISTRATIONS.testMode
        },
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data) {
      results.history_test.status = 'SUCCESS';
      results.history_test.message = `Test history data retrieved from ${baseUrl}`;
    }
  } catch (error) {
    results.history_test.status = 'FAILED';
    if (error.response) {
      results.history_test.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
    } else {
      results.history_test.message = error.message;
    }
  }
}

// Test Valuation API (Live)
async function testValuationLive() {
  console.log(`${colors.blue}Testing Valuation API (Live Key)...${colors.reset}`);
  
  const apiKey = process.env.VALUATION_API_LIVE_KEY;
  const baseUrl = process.env.VALUATION_API_BASE_URL || 'https://checkcardetails.co.uk';
  results.valuation_live.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  
  if (!apiKey) {
    results.valuation_live.status = 'FAILED';
    results.valuation_live.message = 'API key not configured';
    return;
  }

  try {
    const response = await axios.get(
      `${baseUrl}/vehicledata/valuation`,
      {
        params: {
          apikey: apiKey,
          vrm: TEST_REGISTRATIONS.valid
        },
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data) {
      results.valuation_live.status = 'SUCCESS';
      results.valuation_live.message = `Valuation data retrieved from ${baseUrl}`;
    }
  } catch (error) {
    results.valuation_live.status = 'FAILED';
    if (error.response) {
      results.valuation_live.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
    } else {
      results.valuation_live.message = error.message;
    }
  }
}

// Test Valuation API (Test)
async function testValuationTest() {
  console.log(`${colors.blue}Testing Valuation API (Test Key)...${colors.reset}`);
  
  const apiKey = process.env.VALUATION_API_TEST_KEY;
  const baseUrl = process.env.VALUATION_API_TEST_BASE_URL || 'https://checkcardetails.co.uk';
  results.valuation_test.key = apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET';
  
  if (!apiKey) {
    results.valuation_test.status = 'FAILED';
    results.valuation_test.message = 'API key not configured';
    return;
  }

  try {
    const response = await axios.get(
      `${baseUrl}/vehicledata/valuation`,
      {
        params: {
          apikey: apiKey,
          vrm: TEST_REGISTRATIONS.testMode
        },
        timeout: 10000
      }
    );

    if (response.status === 200 && response.data) {
      results.valuation_test.status = 'SUCCESS';
      results.valuation_test.message = `Test valuation data retrieved from ${baseUrl}`;
    }
  } catch (error) {
    results.valuation_test.status = 'FAILED';
    if (error.response) {
      results.valuation_test.message = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
    } else {
      results.valuation_test.message = error.message;
    }
  }
}

// Print results
function printResults() {
  console.log(`\n${colors.cyan}========================================`);
  console.log(`TEST RESULTS`);
  console.log(`========================================${colors.reset}\n`);

  Object.entries(results).forEach(([api, result]) => {
    const statusColor = result.status === 'SUCCESS' ? colors.green : colors.red;
    const statusIcon = result.status === 'SUCCESS' ? '✓' : '✗';
    
    console.log(`${statusColor}${statusIcon} ${api.toUpperCase().replace(/_/g, ' ')}${colors.reset}`);
    console.log(`  Key: ${result.key}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Message: ${result.message}\n`);
  });

  // Summary
  const successCount = Object.values(results).filter(r => r.status === 'SUCCESS').length;
  const totalCount = Object.keys(results).length;
  
  console.log(`${colors.cyan}========================================`);
  console.log(`SUMMARY: ${successCount}/${totalCount} APIs Working`);
  console.log(`========================================${colors.reset}\n`);

  // Recommendations
  console.log(`${colors.yellow}RECOMMENDATIONS:${colors.reset}\n`);
  
  if (results.dvla.status === 'FAILED') {
    console.log(`${colors.red}• DVLA API is not working. Check your API key at:`);
    console.log(`  https://developer-portal.driver-vehicle-licensing.api.gov.uk${colors.reset}\n`);
  }

  const checkcardWorking = results.checkcard_live.status === 'SUCCESS' || results.checkcard_test.status === 'SUCCESS';
  if (!checkcardWorking) {
    console.log(`${colors.red}• CheckCard API is not working. Verify your API keys.${colors.reset}\n`);
  }

  if (results.checkcard_live.status === 'SUCCESS') {
    console.log(`${colors.green}• CheckCard Live API is working - use this for production.${colors.reset}\n`);
  }

  if (results.checkcard_test.status === 'SUCCESS') {
    console.log(`${colors.green}• CheckCard Test API is working - use this for development.${colors.reset}\n`);
  }

  // Environment recommendation
  console.log(`${colors.yellow}CURRENT ENVIRONMENT:${colors.reset} ${process.env.API_ENVIRONMENT || 'NOT SET'}\n`);
  
  if (results.checkcard_live.status === 'SUCCESS') {
    console.log(`${colors.green}✓ Recommended: Set API_ENVIRONMENT=production${colors.reset}\n`);
  } else if (results.checkcard_test.status === 'SUCCESS') {
    console.log(`${colors.yellow}⚠ Recommended: Set API_ENVIRONMENT=test (limited functionality)${colors.reset}\n`);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testDVLAAPI();
    await testCheckCardLive();
    await testCheckCardTest();
    await testHistoryLive();
    await testHistoryTest();
    await testValuationLive();
    await testValuationTest();
    
    printResults();
  } catch (error) {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error.message);
  }
}

// Execute
runAllTests();
