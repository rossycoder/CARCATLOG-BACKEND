/**
 * Test Write-Off Category Extraction
 * Tests if write-off category is properly extracted from API and stored in database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryAPIClient = require('../clients/HistoryAPIClient');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testWriteOffCategory() {
  try {
    console.log(`${colors.cyan}=== Testing Write-Off Category Extraction ===${colors.reset}\n`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Initialize API client
    const apiKey = process.env.CHECKCARDETAILS_API_KEY;
    const baseUrl = process.env.CHECKCARDETAILS_BASE_URL || 'https://uk1.ukvehicledata.co.uk';
    const isTestMode = process.env.CHECKCARDETAILS_TEST_MODE === 'true';
    
    const historyClient = new HistoryAPIClient(apiKey, baseUrl, isTestMode);
    
    console.log(`${colors.blue}API Configuration:${colors.reset}`);
    console.log(`  Base URL: ${baseUrl}`);
    console.log(`  Test Mode: ${isTestMode}`);
    console.log();

    // Test VRM - use a VRM that you know has write-off history
    // Replace with actual VRM from your database
    const testVRM = process.argv[2] || 'RJ08PFA'; // Default test VRM
    
    console.log(`${colors.yellow}Testing VRM: ${testVRM}${colors.reset}\n`);

    // Step 1: Check if vehicle exists in database
    console.log(`${colors.cyan}Step 1: Checking database...${colors.reset}`);
    const existingHistory = await VehicleHistory.findOne({ vrm: testVRM.toUpperCase() });
    
    if (existingHistory) {
      console.log(`${colors.green}✓ Found in database${colors.reset}`);
      console.log(`  ID: ${existingHistory._id}`);
      console.log(`  Is Written Off: ${existingHistory.isWrittenOff}`);
      console.log(`  Write-Off Category: ${existingHistory.writeOffCategory || 'NOT SET'}`);
      console.log(`  Accident Details Severity: ${existingHistory.accidentDetails?.severity || 'NOT SET'}`);
      console.log(`  Write-Off Details:`, existingHistory.writeOffDetails);
      console.log();
    } else {
      console.log(`${colors.yellow}⚠ Not found in database${colors.reset}\n`);
    }

    // Step 2: Fetch fresh data from API
    console.log(`${colors.cyan}Step 2: Fetching from API...${colors.reset}`);
    const apiResult = await historyClient.checkHistory(testVRM);
    
    console.log(`${colors.green}✓ API call successful${colors.reset}`);
    console.log(`  VRM: ${apiResult.vrm}`);
    console.log(`  Is Written Off: ${apiResult.isWrittenOff}`);
    console.log(`  Write-Off Category: ${apiResult.writeOffCategory || 'NOT SET'}`);
    console.log(`  Accident Details Severity: ${apiResult.accidentDetails?.severity || 'NOT SET'}`);
    console.log(`  Write-Off Details:`, apiResult.writeOffDetails);
    console.log();

    // Step 3: Check if category is properly extracted
    console.log(`${colors.cyan}Step 3: Validation${colors.reset}`);
    
    if (apiResult.isWrittenOff) {
      if (apiResult.writeOffCategory && apiResult.writeOffCategory !== 'none' && apiResult.writeOffCategory !== 'unknown') {
        console.log(`${colors.green}✓ Write-off category successfully extracted: ${apiResult.writeOffCategory}${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Write-off detected but category not extracted${colors.reset}`);
        console.log(`  writeOffCategory: ${apiResult.writeOffCategory}`);
        console.log(`  accidentDetails.severity: ${apiResult.accidentDetails?.severity}`);
      }
    } else {
      console.log(`${colors.green}✓ Vehicle is clean (no write-off)${colors.reset}`);
    }
    console.log();

    // Step 4: Save to database and verify
    if (apiResult.isWrittenOff) {
      console.log(`${colors.cyan}Step 4: Saving to database...${colors.reset}`);
      
      const historyData = {
        vrm: apiResult.vrm,
        isWrittenOff: apiResult.isWrittenOff,
        writeOffCategory: apiResult.writeOffCategory,
        writeOffDetails: apiResult.writeOffDetails,
        accidentDetails: apiResult.accidentDetails,
        hasAccidentHistory: apiResult.hasAccidentHistory,
        isStolen: apiResult.isStolen,
        hasOutstandingFinance: apiResult.hasOutstandingFinance,
        numberOfPreviousKeepers: apiResult.numberOfPreviousKeepers,
        checkDate: new Date()
      };

      const savedHistory = await VehicleHistory.findOneAndUpdate(
        { vrm: apiResult.vrm },
        historyData,
        { upsert: true, new: true }
      );

      console.log(`${colors.green}✓ Saved to database${colors.reset}`);
      console.log(`  ID: ${savedHistory._id}`);
      console.log(`  Write-Off Category: ${savedHistory.writeOffCategory}`);
      console.log();
    }

    console.log(`${colors.green}${colors.bright}=== Test Complete ===${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Database connection closed${colors.reset}`);
  }
}

// Run the test
testWriteOffCategory();
