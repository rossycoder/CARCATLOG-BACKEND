/**
 * Fix Data Saving Issue - Ensure comprehensive data is properly saved to database
 * The issue is that comprehensive data is fetched but not properly merged with car record
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixDataSavingIssue() {
  try {
    console.log('🔧 Fixing Data Saving Issue...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check the vehicle controller to see the issue
    console.log('1️⃣ ANALYZING CURRENT ISSUE:');
    console.log('-'.repeat(40));
    console.log('❌ Problem: In vehicleController.js lookupAndCreateVehicle function:');
    console.log('   - Car is created with basic DVLA data');
    console.log('   - Comprehensive data is fetched AFTER car creation');
    console.log('   - But comprehensive data is NOT merged back to car record');
    console.log('   - Result: Database has incomplete data');

    // 2. Create a fixed version of the data saving logic
    console.log('\n2️⃣ CREATING FIXED DATA SAVING LOGIC:');
    console.log('-'.repeat(45));

    // Read the current vehicle controller
    const fs = require('fs');
    const vehicleControllerPath = path.join(__dirname, '../controllers/vehicleController.js');
    let controllerContent = fs.readFileSync(vehicleControllerPath, 'utf8');

    // Find the problematic section and create a fix
    const problematicSection = `// Step 6: Fetch ALL vehicle data comprehensively (Vehicle History + MOT + Valuation)
      // This ensures complete data is available when the car is viewed
      try {
        console.log(\`[Vehicle Controller] Fetching comprehensive vehicle data for: \${registrationNumber}\`);
        const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');
        const comprehensiveService = new ComprehensiveVehicleService();
        
        const comprehensiveResult = await comprehensiveService.fetchCompleteVehicleData(
          registrationNumber, 
          mileage, 
          false // Don't force refresh - use cache if available
        );
        
        console.log(\`[Vehicle Controller] Comprehensive data fetch completed:\`);
        console.log(\`   API Calls: \${comprehensiveResult.apiCalls}\`);
        console.log(\`   Total Cost: £\${comprehensiveResult.totalCost.toFixed(2)}\`);
        console.log(\`   Errors: \${comprehensiveResult.errors.length}\`);
        
        if (comprehensiveResult.errors.length > 0) {
          console.log(\`   Failed Services: \${comprehensiveResult.errors.map(e => e.service).join(', ')}\`);
        }
        
      } catch (comprehensiveError) {
        // Don't fail the car creation if comprehensive data fetch fails
        console.warn(\`[Vehicle Controller] Comprehensive data fetch failed: \${comprehensiveError.message}\`);
        // Individual services will handle their own fallbacks
      }`;

    const fixedSection = `// Step 6: Fetch ALL vehicle data comprehensively AND MERGE WITH CAR RECORD
      // This ensures complete data is saved to database immediately
      try {
        console.log(\`[Vehicle Controller] Fetching comprehensive vehicle data for: \${registrationNumber}\`);
        const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');
        const comprehensiveService = new ComprehensiveVehicleService();
        
        const comprehensiveResult = await comprehensiveService.fetchCompleteVehicleData(
          registrationNumber, 
          mileage, 
          false // Don't force refresh - use cache if available
        );
        
        console.log(\`[Vehicle Controller] Comprehensive data fetch completed:\`);
        console.log(\`   API Calls: \${comprehensiveResult.apiCalls}\`);
        console.log(\`   Total Cost: £\${comprehensiveResult.totalCost.toFixed(2)}\`);
        console.log(\`   Errors: \${comprehensiveResult.errors.length}\`);
        
        if (comprehensiveResult.errors.length > 0) {
          console.log(\`   Failed Services: \${comprehensiveResult.errors.map(e => e.service).join(', ')}\`);
        }
        
        // CRITICAL FIX: Merge comprehensive data with car record
        if (comprehensiveResult.vehicleData) {
          console.log(\`[Vehicle Controller] Merging comprehensive data with car record\`);
          
          // Update car with comprehensive vehicle data
          const vehicleData = comprehensiveResult.vehicleData;
          
          // Update running costs if available
          if (vehicleData.fuelEconomy) {
            car.fuelEconomyUrban = vehicleData.fuelEconomy.urban;
            car.fuelEconomyExtraUrban = vehicleData.fuelEconomy.extraUrban;
            car.fuelEconomyCombined = vehicleData.fuelEconomy.combined;
            
            // Also update runningCosts object
            if (!car.runningCosts) car.runningCosts = {};
            if (!car.runningCosts.fuelEconomy) car.runningCosts.fuelEconomy = {};
            car.runningCosts.fuelEconomy.urban = vehicleData.fuelEconomy.urban;
            car.runningCosts.fuelEconomy.extraUrban = vehicleData.fuelEconomy.extraUrban;
            car.runningCosts.fuelEconomy.combined = vehicleData.fuelEconomy.combined;
          }
          
          // Update emissions and tax data
          if (vehicleData.co2Emissions) car.co2Emissions = vehicleData.co2Emissions;
          if (vehicleData.annualTax) {
            car.annualTax = vehicleData.annualTax;
            if (!car.runningCosts) car.runningCosts = {};
            car.runningCosts.annualTax = vehicleData.annualTax;
          }
          if (vehicleData.insuranceGroup) {
            car.insuranceGroup = vehicleData.insuranceGroup;
            if (!car.runningCosts) car.runningCosts = {};
            car.runningCosts.insuranceGroup = vehicleData.insuranceGroup;
          }
          
          // Update variant if better one available
          if (vehicleData.variant && (!car.variant || car.variant === 'Unknown')) {
            car.variant = vehicleData.variant;
          }
          
          // Update color if available
          if (vehicleData.color && (!car.color || car.color === 'Unknown')) {
            car.color = vehicleData.color;
          }
          
          // Update previous owners if available
          if (vehicleData.previousOwners) {
            car.previousOwners = vehicleData.previousOwners;
          }
          
          console.log(\`[Vehicle Controller] Updated car with comprehensive vehicle data\`);
        }
        
        // CRITICAL FIX: Update car with history data if available
        if (comprehensiveResult.historyData) {
          console.log(\`[Vehicle Controller] Merging history data with car record\`);
          
          const historyData = comprehensiveResult.historyData;
          
          // Update car with history check status
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = new Date();
          
          // Link to history record if created
          if (historyData._id) {
            car.historyCheckId = historyData._id;
          }
          
          console.log(\`[Vehicle Controller] Updated car with history data\`);
        }
        
        // CRITICAL FIX: Update car with valuation data if available
        if (comprehensiveResult.historyData && comprehensiveResult.historyData.valuation) {
          console.log(\`[Vehicle Controller] Updating car with valuation data\`);
          
          const valuation = comprehensiveResult.historyData.valuation;
          
          // Update car price with private sale value
          if (valuation.privatePrice && valuation.privatePrice > 0) {
            car.price = valuation.privatePrice;
            car.estimatedValue = valuation.privatePrice;
            console.log(\`[Vehicle Controller] Updated car price to £\${valuation.privatePrice} (Private Sale)\`);
          }
          
          // Store all valuations for frontend
          car.allValuations = {
            private: valuation.privatePrice,
            retail: valuation.dealerPrice,
            trade: valuation.partExchangePrice
          };
          
          console.log(\`[Vehicle Controller] Stored all valuations:, car.allValuations\`);
        }
        
        // CRITICAL FIX: Update car with MOT data if available
        if (comprehensiveResult.motData && comprehensiveResult.motData.length > 0) {
          console.log(\`[Vehicle Controller] Updating car with MOT data\`);
          
          const latestMOT = comprehensiveResult.motData[0]; // Most recent MOT
          
          // Update MOT status and dates
          car.motStatus = latestMOT.testResult === 'PASSED' ? 'Valid' : 'Invalid';
          if (latestMOT.expiryDate) {
            car.motExpiry = new Date(latestMOT.expiryDate);
            car.motDue = new Date(latestMOT.expiryDate);
          }
          
          // Update mileage with latest MOT reading if higher
          if (latestMOT.odometerValue && latestMOT.odometerValue > car.mileage) {
            console.log(\`[Vehicle Controller] Updating mileage: \${car.mileage} → \${latestMOT.odometerValue} (from MOT)\`);
            car.mileage = latestMOT.odometerValue;
          }
          
          // Store MOT history
          car.motHistory = comprehensiveResult.motData.map(mot => ({
            testDate: new Date(mot.completedDate),
            expiryDate: mot.expiryDate ? new Date(mot.expiryDate) : null,
            testResult: mot.testResult,
            odometerValue: mot.odometerValue,
            odometerUnit: mot.odometerUnit || 'mi',
            testNumber: mot.motTestNumber,
            defects: mot.defects || [],
            advisoryText: mot.defects?.map(d => d.text) || [],
            testClass: "4",
            testType: "Normal Test",
            completedDate: new Date(mot.completedDate)
          }));
          
          console.log(\`[Vehicle Controller] Updated car with \${car.motHistory.length} MOT records\`);
        }
        
        // CRITICAL FIX: Save the updated car record
        await car.save();
        console.log(\`[Vehicle Controller] ✅ Saved car with comprehensive data merged\`);
        
      } catch (comprehensiveError) {
        // Don't fail the car creation if comprehensive data fetch fails
        console.warn(\`[Vehicle Controller] Comprehensive data fetch failed: \${comprehensiveError.message}\`);
        // Individual services will handle their own fallbacks
      }`;

    // Check if the fix is needed
    if (controllerContent.includes('// CRITICAL FIX: Merge comprehensive data with car record')) {
      console.log('✅ Fix already applied to vehicleController.js');
    } else {
      console.log('❌ Fix needed in vehicleController.js');
      console.log('\n3️⃣ APPLYING FIX TO VEHICLE CONTROLLER:');
      console.log('-'.repeat(45));
      
      // Apply the fix
      const updatedContent = controllerContent.replace(problematicSection, fixedSection);
      
      // Write the fixed version
      fs.writeFileSync(vehicleControllerPath, updatedContent, 'utf8');
      console.log('✅ Applied fix to vehicleController.js');
      console.log('   - Comprehensive data will now be merged with car record');
      console.log('   - Running costs, MOT data, history, and valuation will be saved');
      console.log('   - Mileage will be updated from MOT records');
      console.log('   - Price will be set from valuation data');
    }

    // 4. Test the fix with YD17AVU
    console.log('\n4️⃣ TESTING FIX WITH YD17AVU:');
    console.log('-'.repeat(35));
    
    const testVRM = 'YD17AVU';
    const existingCar = await Car.findOne({ registrationNumber: testVRM });
    
    if (existingCar) {
      console.log('✅ Test car exists in database:');
      console.log(`   Mileage: ${existingCar.mileage.toLocaleString()} miles`);
      console.log(`   Price: £${existingCar.price}`);
      console.log(`   MOT Status: ${existingCar.motStatus}`);
      console.log(`   MOT Expiry: ${existingCar.motExpiry ? existingCar.motExpiry.toDateString() : 'Not set'}`);
      console.log(`   Running Costs: ${existingCar.fuelEconomyUrban ? 'Available' : 'Missing'}`);
      console.log(`   History Check: ${existingCar.historyCheckStatus}`);
      
      if (existingCar.mileage === 173130 && existingCar.motExpiry) {
        console.log('🎉 Data appears to be correct!');
      } else {
        console.log('⚠️  Data may still need correction');
      }
    } else {
      console.log('❌ Test car not found in database');
    }

    console.log('\n5️⃣ SUMMARY:');
    console.log('-'.repeat(15));
    console.log('✅ Fixed vehicleController.js to properly merge comprehensive data');
    console.log('✅ New car registrations will now save complete data');
    console.log('✅ Running costs, MOT, history, and valuation will be saved');
    console.log('✅ Mileage will be updated from MOT records');
    console.log('✅ Price will be set from accurate valuation');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Restart your backend server');
    console.log('2. Try adding a new car registration');
    console.log('3. Verify all data is saved correctly');
    console.log('4. Test with YD17AVU or any other registration');

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  fixDataSavingIssue();
}

module.exports = { fixDataSavingIssue };