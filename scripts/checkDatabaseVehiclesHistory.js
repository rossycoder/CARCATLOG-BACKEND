/**
 * Check vehicle history for all cars in database
 * Verify that frontend will display correct history
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkDatabaseVehiclesHistory() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get all cars with registration numbers (regardless of status)
    const cars = await Car.find({ 
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    })
    .select('registrationNumber make model displayTitle status')
    .limit(10); // Check first 10 cars

    console.log(`Found ${cars.length} cars with registration numbers\n`);
    console.log('='.repeat(80));

    let cleanCount = 0;
    let issuesCount = 0;
    let errorCount = 0;

    for (const car of cars) {
      console.log(`\n🚗 ${car.displayTitle || `${car.make} ${car.model}`}`);
      console.log(`Registration: ${car.registrationNumber}`);
      console.log('-'.repeat(80));

      try {
        const historyData = await checkCarDetailsClient.getVehicleHistory(car.registrationNumber);
        const vehicleHistory = historyData.VehicleHistory || {};

        // Check for issues
        const hasWriteOff = vehicleHistory.writeOffRecord === true;
        const hasStolen = vehicleHistory.stolenRecord === true;
        const hasFinance = vehicleHistory.financeRecord === true;
        const previousOwners = vehicleHistory.NumberOfPreviousKeepers || 0;

        console.log('\n📊 History Status:');
        console.log(`  Write-off: ${hasWriteOff ? '❌ YES' : '✅ NO'}`);
        console.log(`  Stolen: ${hasStolen ? '❌ YES' : '✅ NO'}`);
        console.log(`  Finance: ${hasFinance ? '❌ YES' : '✅ NO'}`);
        console.log(`  Previous Owners: ${previousOwners}`);

        if (hasWriteOff && vehicleHistory.writeoff) {
          console.log('\n⚠️  WRITE-OFF DETAILS:');
          const writeoff = Array.isArray(vehicleHistory.writeoff) 
            ? vehicleHistory.writeoff[0] 
            : vehicleHistory.writeoff;
          console.log(`  Status: ${writeoff.status}`);
          console.log(`  Date: ${writeoff.lossdate}`);
          console.log(`  Damage: ${writeoff.damagelocations?.join(', ') || 'Unknown'}`);
        }

        // Count results
        if (hasWriteOff || hasStolen || hasFinance) {
          issuesCount++;
          console.log('\n🔴 This vehicle has history issues');
        } else {
          cleanCount++;
          console.log('\n🟢 This vehicle has clean history');
        }

      } catch (error) {
        errorCount++;
        console.log(`\n❌ Error checking history: ${error.message}`);
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total checked: ${cars.length}`);
    console.log(`Clean history: ${cleanCount} (${Math.round(cleanCount/cars.length*100)}%)`);
    console.log(`With issues: ${issuesCount} (${Math.round(issuesCount/cars.length*100)}%)`);
    console.log(`Errors: ${errorCount}`);
    
    console.log('\n💡 ANALYSIS:');
    if (cleanCount === cars.length) {
      console.log('⚠️  All vehicles show clean history - this is unusual');
      console.log('   Possible reasons:');
      console.log('   1. Test/demo vehicles in database');
      console.log('   2. Limited API data coverage');
      console.log('   3. Recently registered vehicles');
    } else {
      console.log('✅ Good variety in vehicle history - realistic data');
    }

    console.log('\n🎯 FRONTEND DISPLAY:');
    console.log('   - Clean vehicles will show all checks passed ✓');
    console.log('   - Vehicles with issues will show specific failures ✗');
    console.log('   - Disclaimer will remind users to verify independently');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

checkDatabaseVehiclesHistory();
