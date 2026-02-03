/**
 * Test MOT History and Write-Off Category Display After Payment
 * Tests the complete flow from payment completion to frontend display
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testMOTHistoryAfterPayment() {
  try {
    console.log(`${colors.cyan}=== Testing MOT History After Payment Completion ===${colors.reset}\n`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Test with a specific VRM that has Cat D write-off
    const testVRM = process.argv[2] || 'RJ08PFA'; // Known Cat D vehicle
    
    console.log(`${colors.yellow}Testing VRM: ${testVRM}${colors.reset}\n`);

    // Step 1: Find the car in database
    console.log(`${colors.cyan}Step 1: Finding car in database...${colors.reset}`);
    const car = await Car.findOne({ registrationNumber: testVRM.toUpperCase() });
    
    if (!car) {
      console.log(`${colors.red}❌ Car not found in database${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Car found: ${car._id}${colors.reset}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Advert Status: ${car.advertStatus}`);
    console.log(`   History Check ID: ${car.historyCheckId || 'NOT SET'}`);
    console.log(`   MOT History Count: ${car.motHistory?.length || 0}`);

    // Step 2: Check MOT History in Car document
    console.log(`\n${colors.cyan}Step 2: Checking MOT History in Car document...${colors.reset}`);
    
    if (car.motHistory && car.motHistory.length > 0) {
      console.log(`${colors.green}✓ MOT History found: ${car.motHistory.length} tests${colors.reset}`);
      
      // Show latest MOT test
      const latestMOT = car.motHistory[0]; // Should be sorted by date desc
      console.log(`   Latest MOT:`);
      console.log(`     Date: ${latestMOT.testDate}`);
      console.log(`     Result: ${latestMOT.testResult}`);
      console.log(`     Mileage: ${latestMOT.odometerValue} ${latestMOT.odometerUnit}`);
      console.log(`     Defects: ${latestMOT.defects?.length || 0}`);
    } else {
      console.log(`${colors.red}❌ No MOT History found in Car document${colors.reset}`);
    }

    // Step 3: Check VehicleHistory document
    console.log(`\n${colors.cyan}Step 3: Checking VehicleHistory document...${colors.reset}`);
    
    let vehicleHistory = null;
    if (car.historyCheckId) {
      vehicleHistory = await VehicleHistory.findById(car.historyCheckId);
    }
    
    if (!vehicleHistory) {
      console.log(`${colors.red}❌ No VehicleHistory document found${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ VehicleHistory found: ${vehicleHistory._id}${colors.reset}`);
      console.log(`   VRM: ${vehicleHistory.vrm}`);
      console.log(`   Write-off Category: ${vehicleHistory.writeOffCategory || 'NOT SET'}`);
      console.log(`   Is Written Off: ${vehicleHistory.isWrittenOff || false}`);
      console.log(`   MOT History Count: ${vehicleHistory.motHistory?.length || 0}`);
      
      // Check write-off details
      if (vehicleHistory.writeOffDetails) {
        console.log(`   Write-off Details:`);
        console.log(`     Category: ${vehicleHistory.writeOffDetails.category}`);
        console.log(`     Date: ${vehicleHistory.writeOffDetails.date}`);
        console.log(`     Status: ${vehicleHistory.writeOffDetails.status}`);
      }
    }

    // Step 4: Simulate frontend API call
    console.log(`\n${colors.cyan}Step 4: Simulating frontend API call...${colors.reset}`);
    
    const populatedCar = await Car.findById(car._id).populate('historyCheckId');
    
    if (!populatedCar) {
      console.log(`${colors.red}❌ Failed to populate car data${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Car populated successfully${colors.reset}`);
    
    // Step 5: Check what frontend would receive
    console.log(`\n${colors.cyan}Step 5: Analyzing frontend data structure...${colors.reset}`);
    
    const frontendData = {
      // MOT History sources (in order of priority)
      motHistoryFromCar: populatedCar.motHistory || [],
      motHistoryFromVehicleHistory: populatedCar.historyCheckId?.motHistory || [],
      
      // Write-off category sources
      writeOffCategoryFromVehicleHistory: populatedCar.historyCheckId?.writeOffCategory,
      writeOffDetailsFromVehicleHistory: populatedCar.historyCheckId?.writeOffDetails,
      
      // Basic MOT status
      motStatus: populatedCar.motStatus,
      motExpiry: populatedCar.motExpiry || populatedCar.motDue,
      
      // Population status
      hasHistoryCheckId: !!populatedCar.historyCheckId,
      historyCheckIdPopulated: !!populatedCar.historyCheckId?._id
    };
    
    console.log(`Frontend Data Analysis:`);
    console.log(`   MOT History in Car: ${frontendData.motHistoryFromCar.length} tests`);
    console.log(`   MOT History in VehicleHistory: ${frontendData.motHistoryFromVehicleHistory.length} tests`);
    console.log(`   Write-off Category: ${frontendData.writeOffCategoryFromVehicleHistory || 'NOT SET'}`);
    console.log(`   History Check ID: ${frontendData.hasHistoryCheckId ? '✓ Present' : '❌ Missing'}`);
    console.log(`   History Populated: ${frontendData.historyCheckIdPopulated ? '✓ Yes' : '❌ No'}`);

    // Step 6: Test MOTHistorySection logic
    console.log(`\n${colors.cyan}Step 6: Testing MOTHistorySection component logic...${colors.reset}`);
    
    // Simulate MOTHistorySection.jsx logic
    let motHistoryForDisplay = null;
    let motHistorySource = 'none';
    
    // Check car.motHistory first (highest priority)
    if (frontendData.motHistoryFromCar.length > 0) {
      motHistoryForDisplay = frontendData.motHistoryFromCar;
      motHistorySource = 'car_document';
    }
    // Check historyCheckId.motHistory second
    else if (frontendData.motHistoryFromVehicleHistory.length > 0) {
      motHistoryForDisplay = frontendData.motHistoryFromVehicleHistory;
      motHistorySource = 'vehicle_history';
    }
    // Check basic MOT status third
    else if (frontendData.motStatus || frontendData.motExpiry) {
      motHistoryForDisplay = [];
      motHistorySource = 'basic_status';
    }
    
    console.log(`MOT Display Logic:`);
    console.log(`   Source: ${motHistorySource}`);
    console.log(`   Tests to display: ${motHistoryForDisplay?.length || 0}`);
    
    if (motHistoryForDisplay && motHistoryForDisplay.length > 0) {
      const latestTest = motHistoryForDisplay[0];
      console.log(`   Latest test: ${latestTest.testResult} on ${latestTest.testDate}`);
    }

    // Step 7: Test VehicleHistorySection write-off logic
    console.log(`\n${colors.cyan}Step 7: Testing VehicleHistorySection write-off logic...${colors.reset}`);
    
    const historyData = populatedCar.historyCheckId || {};
    
    // Simulate VehicleHistorySection.jsx write-off check logic
    const isWrittenOff = historyData.hasAccidentHistory === true || historyData.isWrittenOff === true;
    const severity = historyData.writeOffCategory || historyData.accidentDetails?.severity;
    const hasValidSeverity = severity && 
                            severity !== 'unknown' && 
                            severity !== null && 
                            severity !== 'none' &&
                            severity.trim() !== '';
    
    console.log(`Write-off Display Logic:`);
    console.log(`   Is Written Off: ${isWrittenOff}`);
    console.log(`   Severity: ${severity || 'NOT SET'}`);
    console.log(`   Has Valid Severity: ${hasValidSeverity}`);
    
    // Generate display label
    let displayLabel;
    if ((isWrittenOff || hasValidSeverity) && hasValidSeverity) {
      displayLabel = `Category ${severity.toUpperCase()} - Written off`;
    } else if (isWrittenOff) {
      displayLabel = 'Written off - Category unknown';
    } else {
      displayLabel = 'Never been written off';
    }
    
    console.log(`   Display Label: "${displayLabel}"`);
    console.log(`   Badge Color: ${hasValidSeverity ? 'RED (Failed)' : 'GREEN (Passed)'}`);

    // Step 8: Final diagnosis
    console.log(`\n${colors.cyan}Step 8: Final Diagnosis...${colors.reset}`);
    
    const issues = [];
    
    if (frontendData.motHistoryFromCar.length === 0 && frontendData.motHistoryFromVehicleHistory.length === 0) {
      issues.push('❌ No MOT history found in either Car or VehicleHistory documents');
    }
    
    if (!frontendData.hasHistoryCheckId) {
      issues.push('❌ Car document missing historyCheckId reference');
    }
    
    if (!frontendData.historyCheckIdPopulated) {
      issues.push('❌ historyCheckId not properly populated in API response');
    }
    
    if (!frontendData.writeOffCategoryFromVehicleHistory) {
      issues.push('❌ Write-off category not found in VehicleHistory document');
    }
    
    if (issues.length === 0) {
      console.log(`${colors.green}✅ All checks passed! MOT history and write-off category should display correctly.${colors.reset}`);
    } else {
      console.log(`${colors.red}Issues found:${colors.reset}`);
      issues.forEach(issue => console.log(`   ${issue}`));
    }

  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
  } finally {
    await mongoose.disconnect();
    console.log(`\n${colors.blue}Disconnected from MongoDB${colors.reset}`);
  }
}

// Run the test
testMOTHistoryAfterPayment();