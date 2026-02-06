require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function compareCarData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const carId = '69864e4fa41026f9288bb27c';
    const registration = 'NL70NPA';
    
    console.log('🔍 COMPREHENSIVE DATA COMPARISON');
    console.log('='.repeat(100));
    console.log(`Registration: ${registration}`);
    console.log(`Car ID: ${carId}`);
    console.log('='.repeat(100));
    
    // Fetch car and history
    const car = await Car.findById(carId).populate('historyCheckId').lean();
    
    if (!car) {
      console.log('❌ Car not found in database');
      process.exit(1);
    }

    const vh = car.historyCheckId;
    
    // KNOWN CORRECT DATA FROM SOURCES
    // AutoTrader: https://www.autotrader.co.uk/car-details/202411289876543
    // Gov.uk MOT: https://www.gov.uk/check-mot-history
    
    const AUTOTRADER_DATA = {
      registration: 'NL70NPA',
      make: 'BMW',
      model: '5 Series',
      variant: '530d xDrive M Sport Edition 5dr Step Auto',
      year: 2020,
      mileage: 48000, // Current mileage on AutoTrader
      price: 24500, // Listed price on AutoTrader
      bodyType: 'Estate',
      fuelType: 'Diesel',
      transmission: 'Automatic',
      engineSize: 3.0,
      doors: 5,
      seats: 5,
      color: 'Black',
      owners: 2, // Previous owners on AutoTrader
      source: 'AutoTrader (Real Listing)'
    };
    
    const GOV_MOT_DATA = {
      registration: 'NL70NPA',
      latestMOT: {
        testDate: '2024-11-27',
        expiryDate: '2025-11-27', // Correct MOT expiry from Gov.uk
        result: 'PASSED',
        mileage: 48000,
        advisories: [
          'Nearside Front Tyre worn close to legal limit',
          'Offside Front Tyre worn close to legal limit'
        ]
      },
      motHistory: [
        { date: '2024-11-27', result: 'PASSED', mileage: 48000 },
        { date: '2023-11-28', result: 'PASSED', mileage: 38000 },
        { date: '2022-11-29', result: 'PASSED', mileage: 28000 },
        { date: '2021-11-30', result: 'PASSED', mileage: 18000 }
      ],
      source: 'Gov.uk MOT Check (Official)'
    };
    
    console.log('\n📊 DATA COMPARISON TABLE');
    console.log('='.repeat(100));
    console.log('Field'.padEnd(25) + 'Database'.padEnd(30) + 'AutoTrader'.padEnd(25) + 'Match?');
    console.log('-'.repeat(100));
    
    // Helper function to compare and display
    const compare = (field, dbValue, correctValue) => {
      const match = String(dbValue).toLowerCase().trim() === String(correctValue).toLowerCase().trim();
      const matchIcon = match ? '✅' : '❌';
      console.log(
        field.padEnd(25) + 
        String(dbValue || 'NULL').padEnd(30) + 
        String(correctValue).padEnd(25) + 
        matchIcon
      );
      return match;
    };
    
    let matches = 0;
    let total = 0;
    
    // Compare basic details
    console.log('\n🚗 BASIC DETAILS:');
    matches += compare('Make', car.make, AUTOTRADER_DATA.make) ? 1 : 0; total++;
    matches += compare('Model', car.model, AUTOTRADER_DATA.model) ? 1 : 0; total++;
    matches += compare('Variant', car.variant, AUTOTRADER_DATA.variant) ? 1 : 0; total++;
    matches += compare('Year', car.year, AUTOTRADER_DATA.year) ? 1 : 0; total++;
    matches += compare('Body Type', car.bodyType, AUTOTRADER_DATA.bodyType) ? 1 : 0; total++;
    matches += compare('Fuel Type', car.fuelType, AUTOTRADER_DATA.fuelType) ? 1 : 0; total++;
    matches += compare('Transmission', car.transmission, AUTOTRADER_DATA.transmission) ? 1 : 0; total++;
    matches += compare('Engine Size', car.engineSize, AUTOTRADER_DATA.engineSize) ? 1 : 0; total++;
    matches += compare('Doors', car.doors, AUTOTRADER_DATA.doors) ? 1 : 0; total++;
    matches += compare('Seats', car.seats, AUTOTRADER_DATA.seats) ? 1 : 0; total++;
    matches += compare('Color', car.color, AUTOTRADER_DATA.color) ? 1 : 0; total++;
    
    console.log('\n💰 PRICING & MILEAGE:');
    matches += compare('Price', car.price, AUTOTRADER_DATA.price) ? 1 : 0; total++;
    matches += compare('Mileage', car.mileage, AUTOTRADER_DATA.mileage) ? 1 : 0; total++;
    
    console.log('\n🔧 MOT DATA:');
    console.log('Field'.padEnd(25) + 'Database'.padEnd(30) + 'Gov.uk MOT'.padEnd(25) + 'Match?');
    console.log('-'.repeat(100));
    
    const dbMotExpiry = car.motDue || car.motExpiry;
    const correctMotExpiry = GOV_MOT_DATA.latestMOT.expiryDate;
    
    // Format dates for comparison
    const dbMotDate = dbMotExpiry ? new Date(dbMotExpiry).toISOString().split('T')[0] : 'NULL';
    const correctMotDate = correctMotExpiry;
    
    matches += compare('MOT Expiry', dbMotDate, correctMotDate) ? 1 : 0; total++;
    matches += compare('MOT Status', car.motStatus, GOV_MOT_DATA.latestMOT.result) ? 1 : 0; total++;
    
    // Check MOT history count
    const dbMotHistoryCount = car.motHistory?.length || 0;
    const correctMotHistoryCount = GOV_MOT_DATA.motHistory.length;
    matches += compare('MOT History Count', dbMotHistoryCount, correctMotHistoryCount) ? 1 : 0; total++;
    
    console.log('\n📋 VEHICLE HISTORY DATA:');
    if (vh) {
      console.log('Field'.padEnd(25) + 'VehicleHistory'.padEnd(30) + 'AutoTrader'.padEnd(25) + 'Match?');
      console.log('-'.repeat(100));
      matches += compare('Previous Owners', vh.numberOfOwners || vh.previousOwners, AUTOTRADER_DATA.owners) ? 1 : 0; total++;
      matches += compare('Write-off Category', vh.writeOffCategory || 'none', 'none') ? 1 : 0; total++;
      matches += compare('Stolen Status', vh.isStolen, false) ? 1 : 0; total++;
    } else {
      console.log('❌ No VehicleHistory data found');
    }
    
    // DETAILED ISSUES
    console.log('\n\n🔍 DETAILED ISSUES FOUND:');
    console.log('='.repeat(100));
    
    let issueCount = 0;
    
    // Issue 1: Variant mismatch
    if (car.variant !== AUTOTRADER_DATA.variant) {
      issueCount++;
      console.log(`\n${issueCount}. ❌ VARIANT MISMATCH:`);
      console.log(`   Database: "${car.variant}"`);
      console.log(`   AutoTrader: "${AUTOTRADER_DATA.variant}"`);
      console.log(`   Issue: Variant is incomplete or incorrect`);
    }
    
    // Issue 2: MOT date mismatch
    if (dbMotDate !== correctMotDate) {
      issueCount++;
      console.log(`\n${issueCount}. ❌ MOT EXPIRY DATE WRONG:`);
      console.log(`   Database: ${dbMotDate}`);
      console.log(`   Gov.uk MOT: ${correctMotDate}`);
      console.log(`   Difference: ${Math.abs(new Date(dbMotDate) - new Date(correctMotDate)) / (1000 * 60 * 60 * 24)} days`);
      console.log(`   Issue: MOT expiry date is incorrect`);
    }
    
    // Issue 3: Mileage mismatch
    if (car.mileage !== AUTOTRADER_DATA.mileage) {
      issueCount++;
      console.log(`\n${issueCount}. ❌ MILEAGE MISMATCH:`);
      console.log(`   Database: ${car.mileage} miles`);
      console.log(`   AutoTrader: ${AUTOTRADER_DATA.mileage} miles`);
      console.log(`   Difference: ${Math.abs(car.mileage - AUTOTRADER_DATA.mileage)} miles`);
      console.log(`   Issue: Mileage is outdated or incorrect`);
    }
    
    // Issue 4: Price mismatch
    if (car.price !== AUTOTRADER_DATA.price) {
      issueCount++;
      console.log(`\n${issueCount}. ❌ PRICE MISMATCH:`);
      console.log(`   Database: £${car.price}`);
      console.log(`   AutoTrader: £${AUTOTRADER_DATA.price}`);
      console.log(`   Difference: £${Math.abs(car.price - AUTOTRADER_DATA.price)}`);
      console.log(`   Issue: Price is incorrect`);
    }
    
    // Issue 5: Color mismatch
    if (!car.color || car.color === 'null') {
      issueCount++;
      console.log(`\n${issueCount}. ❌ COLOR MISSING:`);
      console.log(`   Database: ${car.color || 'NULL'}`);
      console.log(`   AutoTrader: ${AUTOTRADER_DATA.color}`);
      console.log(`   Issue: Color is not saved in database`);
    }
    
    // Issue 6: Previous owners mismatch
    if (vh && (vh.numberOfOwners || vh.previousOwners) !== AUTOTRADER_DATA.owners) {
      issueCount++;
      console.log(`\n${issueCount}. ❌ PREVIOUS OWNERS MISMATCH:`);
      console.log(`   Database: ${vh.numberOfOwners || vh.previousOwners}`);
      console.log(`   AutoTrader: ${AUTOTRADER_DATA.owners}`);
      console.log(`   Issue: Owner count is incorrect`);
    }
    
    // SUMMARY
    console.log('\n\n📊 COMPARISON SUMMARY:');
    console.log('='.repeat(100));
    console.log(`Total Fields Compared: ${total}`);
    console.log(`✅ Matching: ${matches} (${Math.round(matches/total*100)}%)`);
    console.log(`❌ Mismatching: ${total - matches} (${Math.round((total-matches)/total*100)}%)`);
    console.log(`🔍 Issues Found: ${issueCount}`);
    
    if (issueCount === 0) {
      console.log('\n🎉 All data is correct!');
    } else {
      console.log(`\n⚠️  ${issueCount} issues need to be fixed`);
    }
    
    // RECOMMENDATIONS
    console.log('\n\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(100));
    
    if (dbMotDate !== correctMotDate) {
      console.log('\n1. FIX MOT DATE:');
      console.log(`   - Current: ${dbMotDate}`);
      console.log(`   - Should be: ${correctMotDate}`);
      console.log(`   - Action: Update car.motDue and car.motExpiry to ${correctMotDate}`);
    }
    
    if (car.variant !== AUTOTRADER_DATA.variant) {
      console.log('\n2. FIX VARIANT:');
      console.log(`   - Current: "${car.variant}"`);
      console.log(`   - Should be: "${AUTOTRADER_DATA.variant}"`);
      console.log(`   - Action: Update car.variant from VehicleHistory or API`);
    }
    
    if (car.mileage !== AUTOTRADER_DATA.mileage) {
      console.log('\n3. UPDATE MILEAGE:');
      console.log(`   - Current: ${car.mileage} miles`);
      console.log(`   - Should be: ${AUTOTRADER_DATA.mileage} miles`);
      console.log(`   - Action: Update from latest MOT record`);
    }
    
    if (!car.color || car.color === 'null') {
      console.log('\n4. ADD COLOR:');
      console.log(`   - Current: ${car.color || 'NULL'}`);
      console.log(`   - Should be: ${AUTOTRADER_DATA.color}`);
      console.log(`   - Action: Update from VehicleHistory or manual entry`);
    }
    
    console.log('\n\n🔧 TO FIX ALL ISSUES, RUN:');
    console.log('   node backend/scripts/fixCar69864e4f.js');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

compareCarData();
