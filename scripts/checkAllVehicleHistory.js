/**
 * Check All Vehicle History Data
 * Verifies vehicle history for all registrations in the database
 * Checks both frontend display and backend data consistency
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryService = require('../services/historyService');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function checkAllVehicleHistory() {
  try {
    console.log(`${colors.cyan}=== Vehicle History Check Started ===${colors.reset}\n`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Get all cars with registration numbers
    const cars = await Car.find({ 
      registrationNumber: { $exists: true, $ne: null, $ne: '' } 
    }).select('registrationNumber make model year price status userId').lean();

    console.log(`${colors.blue}Found ${cars.length} vehicles with registration numbers${colors.reset}\n`);

    if (cars.length === 0) {
      console.log(`${colors.yellow}No vehicles found with registration numbers${colors.reset}`);
      return;
    }

    const results = {
      total: cars.length,
      withHistory: 0,
      withoutHistory: 0,
      historyErrors: 0,
      dataIssues: [],
      missingHistory: [],
      erroredHistory: [],
    };

    // Check each vehicle
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const vrm = car.registrationNumber.toUpperCase();
      
      console.log(`${colors.cyan}[${i + 1}/${cars.length}] Checking ${vrm} - ${car.make} ${car.model} (${car.year})${colors.reset}`);

      try {
        // Check if history exists in database
        const cachedHistory = await VehicleHistory.getMostRecent(vrm);
        
        if (cachedHistory) {
          results.withHistory++;
          
          // Check data quality
          const issues = checkDataQuality(cachedHistory, car);
          
          if (issues.length > 0) {
            results.dataIssues.push({
              vrm,
              carId: car._id,
              make: car.make,
              model: car.model,
              issues,
            });
            
            console.log(`  ${colors.yellow}⚠ Data issues found:${colors.reset}`);
            issues.forEach(issue => {
              console.log(`    - ${issue}`);
            });
          } else {
            console.log(`  ${colors.green}✓ History data looks good${colors.reset}`);
          }
          
          // Display key history data
          displayHistoryData(cachedHistory);
          
        } else {
          results.withoutHistory++;
          results.missingHistory.push({
            vrm,
            carId: car._id,
            make: car.make,
            model: car.model,
            year: car.year,
          });
          
          console.log(`  ${colors.red}✗ No history data found${colors.reset}`);
        }
        
      } catch (error) {
        results.historyErrors++;
        results.erroredHistory.push({
          vrm,
          carId: car._id,
          make: car.make,
          model: car.model,
          error: error.message,
        });
        
        console.log(`  ${colors.red}✗ Error checking history: ${error.message}${colors.reset}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Print summary
    printSummary(results);

    // Close connection
    await mongoose.connection.close();
    console.log(`\n${colors.green}✓ MongoDB connection closed${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Check data quality of vehicle history
 */
function checkDataQuality(history, car) {
  const issues = [];

  // Check for missing critical fields
  if (!history.make || history.make === 'Unknown') {
    issues.push('Make is missing or unknown');
  }
  
  if (!history.model || history.model === 'Unknown') {
    issues.push('Model is missing or unknown');
  }

  // Check for contradictions in write-off status
  if (history.isWrittenOff === true && history.hasAccidentHistory === false) {
    issues.push('Contradiction: isWrittenOff=true but hasAccidentHistory=false');
  }

  if (history.hasAccidentHistory === true && !history.accidentDetails) {
    issues.push('hasAccidentHistory=true but accidentDetails is missing');
  }

  if (history.hasAccidentHistory === true && 
      history.accidentDetails && 
      history.accidentDetails.severity === 'unknown') {
    issues.push('Accident history exists but severity is unknown');
  }

  // Check for default/placeholder values that should be real data
  if (history.numberOfPreviousKeepers === 0 && history.previousOwners === 0 && history.numberOfOwners === 0) {
    issues.push('All owner count fields are 0 - may be missing data');
  }

  if (history.numberOfKeys === 1 && history.keys === 1) {
    issues.push('Keys count is default value (1) - may not be actual data');
  }

  if (history.serviceHistory === 'Contact seller' || history.serviceHistory === 'Unknown') {
    issues.push('Service history is placeholder value');
  }

  // Check for stolen/scrapped/exported flags
  if (history.isStolen === true) {
    issues.push('⚠️ ALERT: Vehicle is marked as STOLEN');
  }

  if (history.isScrapped === true) {
    issues.push('⚠️ ALERT: Vehicle is marked as SCRAPPED');
  }

  if (history.isExported === true) {
    issues.push('Vehicle is marked as EXPORTED');
  }

  // Check data freshness
  const daysSinceCheck = (Date.now() - history.checkDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCheck > 30) {
    issues.push(`History data is ${Math.floor(daysSinceCheck)} days old (>30 days)`);
  }

  return issues;
}

/**
 * Display key history data
 */
function displayHistoryData(history) {
  console.log(`  ${colors.magenta}History Data:${colors.reset}`);
  console.log(`    Make/Model: ${history.make} ${history.model}`);
  console.log(`    Previous Keepers: ${history.numberOfPreviousKeepers || history.previousOwners || history.numberOfOwners || 0}`);
  console.log(`    Keys: ${history.numberOfKeys || history.keys || 'Unknown'}`);
  console.log(`    Service History: ${history.serviceHistory || 'Unknown'}`);
  console.log(`    Written Off: ${history.isWrittenOff ? 'YES' : 'NO'}`);
  
  if (history.isWrittenOff || history.hasAccidentHistory) {
    const severity = history.accidentDetails?.severity || 'unknown';
    console.log(`    ${colors.red}Write-off Category: ${severity.toUpperCase()}${colors.reset}`);
  }
  
  console.log(`    Stolen: ${history.isStolen ? colors.red + 'YES' + colors.reset : 'NO'}`);
  console.log(`    Scrapped: ${history.isScrapped ? 'YES' : 'NO'}`);
  console.log(`    Imported: ${history.isImported ? 'YES' : 'NO'}`);
  console.log(`    Exported: ${history.isExported ? 'YES' : 'NO'}`);
  console.log(`    MOT Status: ${history.motStatus || 'Unknown'}`);
  
  if (history.motExpiryDate) {
    console.log(`    MOT Expiry: ${new Date(history.motExpiryDate).toLocaleDateString('en-GB')}`);
  }
  
  console.log(`    Check Date: ${new Date(history.checkDate).toLocaleDateString('en-GB')}`);
  console.log(`    API Provider: ${history.apiProvider || 'Unknown'}`);
  console.log(`    Test Mode: ${history.testMode ? 'YES' : 'NO'}`);
}

/**
 * Print summary report
 */
function printSummary(results) {
  console.log(`\n${colors.cyan}=== Summary Report ===${colors.reset}\n`);
  
  console.log(`Total Vehicles: ${results.total}`);
  console.log(`${colors.green}With History: ${results.withHistory}${colors.reset}`);
  console.log(`${colors.red}Without History: ${results.withoutHistory}${colors.reset}`);
  console.log(`${colors.yellow}Data Issues: ${results.dataIssues.length}${colors.reset}`);
  console.log(`${colors.red}Errors: ${results.historyErrors}${colors.reset}`);

  // Missing history details
  if (results.missingHistory.length > 0) {
    console.log(`\n${colors.yellow}=== Vehicles Missing History ===${colors.reset}`);
    results.missingHistory.forEach(item => {
      console.log(`  ${item.vrm} - ${item.make} ${item.model} (${item.year})`);
    });
  }

  // Data issues details
  if (results.dataIssues.length > 0) {
    console.log(`\n${colors.yellow}=== Vehicles with Data Issues ===${colors.reset}`);
    results.dataIssues.forEach(item => {
      console.log(`\n  ${colors.cyan}${item.vrm} - ${item.make} ${item.model}${colors.reset}`);
      item.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    });
  }

  // Error details
  if (results.erroredHistory.length > 0) {
    console.log(`\n${colors.red}=== Vehicles with Errors ===${colors.reset}`);
    results.erroredHistory.forEach(item => {
      console.log(`  ${item.vrm} - ${item.make} ${item.model}`);
      console.log(`    Error: ${item.error}`);
    });
  }

  // Recommendations
  console.log(`\n${colors.cyan}=== Recommendations ===${colors.reset}`);
  
  if (results.withoutHistory > 0) {
    console.log(`\n${colors.yellow}1. Fetch missing history data:${colors.reset}`);
    console.log(`   Run: node backend/scripts/fetchMissingHistory.js`);
  }
  
  if (results.dataIssues.length > 0) {
    console.log(`\n${colors.yellow}2. Review data quality issues:${colors.reset}`);
    console.log(`   - Check for placeholder values (Contact seller, Unknown)`);
    console.log(`   - Verify write-off status contradictions`);
    console.log(`   - Update stale data (>30 days old)`);
  }
  
  if (results.historyErrors > 0) {
    console.log(`\n${colors.yellow}3. Investigate errors:${colors.reset}`);
    console.log(`   - Check API connectivity`);
    console.log(`   - Verify API credentials`);
    console.log(`   - Review error logs`);
  }
}

// Run the check
checkAllVehicleHistory();
