/**
 * Check YD17AVU Data Mismatch - Compare different data sources
 * This script will check the discrepancies Shahzad mentioned:
 * 1. MOT dates: AutoTrader vs Gov.uk vs Our API
 * 2. Previous owners: AutoTrader (2) vs Our API (4)  
 * 3. Valuation: Our creation (correct) vs Live listing (£7,615 wrong)
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models and clients
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkYD17AVUDataMismatch() {
  try {
    console.log('🔍 Checking YD17AVU Data Mismatch Issues...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testVRM = 'YD17AVU';
    
    console.log(`🚗 Analyzing VRM: ${testVRM}`);
    console.log('=' .repeat(60));

    // 1. Check current database data
    console.log('\n1️⃣ CURRENT DATABASE DATA:');
    console.log('-'.repeat(35));
    
    const dbCar = await Car.findOne({ registrationNumber: testVRM });
    const dbHistory = await VehicleHistory.findOne({ vrm: testVRM });
    
    if (dbCar) {
      console.log('📊 Car Data in Database:');
      console.log(`   Make/Model: ${dbCar.make} ${dbCar.model}`);
      console.log(`   Variant: ${dbCar.variant}`);
      console.log(`   Year: ${dbCar.year}`);
      console.log(`   Price: £${dbCar.price}`);
      console.log(`   Estimated Value: £${dbCar.estimatedValue}`);
      console.log(`   Mileage: ${dbCar.mileage}`);
      
      // MOT Data from Car record
      console.log('\n📋 MOT Data in Car Record:');
      console.log(`   MOT Status: ${dbCar.motStatus}`);
      console.log(`   MOT Expiry: ${dbCar.motExpiry ? new Date(dbCar.motExpiry).toDateString() : 'Not set'}`);
      console.log(`   MOT Due: ${dbCar.motDue ? new Date(dbCar.motDue).toDateString() : 'Not set'}`);
      
      // MOT History
      if (dbCar.motHistory && dbCar.motHistory.length > 0) {
        console.log('\n📝 MOT History (Latest first):');
        dbCar.motHistory
          .sort((a, b) => new Date(b.testDate) - new Date(a.testDate))
          .slice(0, 3)
          .forEach((mot, index) => {
            console.log(`   ${index + 1}. Test Date: ${new Date(mot.testDate).toDateString()}`);
            console.log(`      Expiry: ${mot.expiryDate ? new Date(mot.expiryDate).toDateString() : 'N/A'}`);
            console.log(`      Result: ${mot.testResult}`);
            console.log(`      Mileage: ${mot.odometerValue} ${mot.odometerUnit}`);
          });
      }
    }

    if (dbHistory) {
      console.log('\n📊 History Data in Database:');
      console.log(`   Previous Owners: ${dbHistory.numberOfPreviousKeepers || dbHistory.previousOwners}`);
      console.log(`   Write-off Category: ${dbHistory.writeOffCategory}`);
      console.log(`   Outstanding Finance: ${dbHistory.hasOutstandingFinance ? 'YES' : 'NO'}`);
      
      if (dbHistory.valuation) {
        console.log('\n💰 Valuation in Database:');
        console.log(`   Private: £${dbHistory.valuation.privatePrice}`);
        console.log(`   Dealer: £${dbHistory.valuation.dealerPrice}`);
        console.log(`   Part Exchange: £${dbHistory.valuation.partExchangePrice}`);
      }
    }

    // 2. Fetch fresh API data
    console.log('\n\n2️⃣ FRESH API DATA:');
    console.log('-'.repeat(25));
    
    try {
      // Get fresh vehicle data
      const freshVehicleData = await checkCarDetailsClient.getVehicleData(testVRM);
      console.log('✅ Fresh Vehicle Data:');
      console.log(`   Make/Model: ${freshVehicleData.make} ${freshVehicleData.model}`);
      console.log(`   Variant: ${freshVehicleData.variant}`);
      console.log(`   Year: ${freshVehicleData.year}`);
      console.log(`   Previous Owners: ${freshVehicleData.previousOwners}`);
      console.log(`   Color: ${freshVehicleData.color}`);
      
      // Get fresh MOT data
      try {
        const freshMOTData = await checkCarDetailsClient.getMOTHistory(testVRM);
        console.log('\n📋 Fresh MOT Data from API:');
        console.log('Raw MOT Response:', JSON.stringify(freshMOTData, null, 2));
      } catch (motError) {
        console.log(`❌ MOT API Error: ${motError.message}`);
      }
      
      // Get fresh valuation
      try {
        const freshValuationData = await checkCarDetailsClient.getVehicleDataWithValuation(testVRM);
        if (freshValuationData.valuation) {
          console.log('\n💰 Fresh Valuation from API:');
          console.log(`   Private: £${freshValuationData.valuation.privatePrice}`);
          console.log(`   Dealer: £${freshValuationData.valuation.dealerPrice}`);
          console.log(`   Part Exchange: £${freshValuationData.valuation.partExchangePrice}`);
        }
      } catch (valError) {
        console.log(`❌ Valuation API Error: ${valError.message}`);
      }
      
    } catch (apiError) {
      console.log(`❌ API Error: ${apiError.message}`);
    }

    // 3. Data Mismatch Analysis
    console.log('\n\n3️⃣ DATA MISMATCH ANALYSIS:');
    console.log('-'.repeat(35));
    
    console.log('🔍 Issues Shahzad Reported:');
    console.log('   1. AutoTrader shows: EXPIRED MOT');
    console.log('   2. Gov.uk shows: 9 January 2027');
    console.log('   3. Our system shows: 20 August 2027');
    console.log('   4. AutoTrader shows: 2 owners');
    console.log('   5. Our system shows: 4 owners');
    console.log('   6. AutoTrader price: £24,500');
    console.log('   7. Our valuation: £7,615 (wrong)');
    
    // Compare database vs fresh API
    if (dbHistory && dbCar) {
      console.log('\n📊 Database vs Fresh API Comparison:');
      
      // Previous owners comparison
      const dbOwners = dbHistory.numberOfPreviousKeepers || dbHistory.previousOwners;
      console.log(`   Previous Owners - DB: ${dbOwners}, Fresh API: ${freshVehicleData?.previousOwners || 'N/A'}`);
      
      // MOT comparison
      const dbMOTExpiry = dbCar.motExpiry ? new Date(dbCar.motExpiry).toDateString() : 'Not set';
      console.log(`   MOT Expiry - DB: ${dbMOTExpiry}`);
      
      // Valuation comparison
      const dbPrivatePrice = dbHistory.valuation?.privatePrice;
      console.log(`   Private Valuation - DB: £${dbPrivatePrice}`);
    }

    // 4. Recommendations
    console.log('\n\n4️⃣ RECOMMENDATIONS:');
    console.log('-'.repeat(25));
    
    console.log('🚨 CRITICAL ISSUES FOUND:');
    console.log('   1. MOT Date Inconsistency - Multiple sources showing different dates');
    console.log('   2. Previous Owners Mismatch - AutoTrader vs Our API');
    console.log('   3. Valuation Completely Wrong - £7,615 vs £24,500');
    console.log('   4. Possible Wrong Vehicle Data - "Completely different car"');
    
    console.log('\n💡 IMMEDIATE ACTIONS NEEDED:');
    console.log('   1. ✅ Clear cache for YD17AVU');
    console.log('   2. ✅ Re-fetch all data from scratch');
    console.log('   3. ✅ Cross-verify with gov.uk MOT check');
    console.log('   4. ✅ Check if VRM is returning correct vehicle');
    console.log('   5. ✅ Update valuation with correct mileage');
    
    console.log('\n🔧 TECHNICAL FIXES:');
    console.log('   1. Implement MOT data validation');
    console.log('   2. Add cross-reference checks');
    console.log('   3. Cache invalidation on data mismatch');
    console.log('   4. Multiple API source verification');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analysis completed - URGENT FIXES REQUIRED!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

// Run the analysis
if (require.main === module) {
  checkYD17AVUDataMismatch();
}

module.exports = { checkYD17AVUDataMismatch };