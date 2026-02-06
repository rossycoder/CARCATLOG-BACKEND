require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkAPIvsDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const carId = '69864e4fa41026f9288bb27c';
    const registration = 'NL70NPA';
    
    console.log('🔍 API vs DATABASE COMPARISON');
    console.log('='.repeat(100));
    console.log(`Registration: ${registration}`);
    console.log('='.repeat(100));
    
    // Fetch car and history
    const car = await Car.findById(carId).lean();
    const vh = await VehicleHistory.findById(car.historyCheckId).lean();
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    if (!vh) {
      console.log('❌ VehicleHistory not found');
      process.exit(1);
    }
    
    console.log('\n📋 WHAT API RETURNED (VehicleHistory Collection):');
    console.log('='.repeat(100));
    console.log('VRM:', vh.vrm);
    console.log('Make:', vh.make);
    console.log('Model:', vh.model);
    console.log('Variant:', vh.variant);
    console.log('Year:', vh.yearOfManufacture);
    console.log('Color:', vh.colour);
    console.log('Body Type:', vh.bodyType);
    console.log('Transmission:', vh.transmission);
    console.log('Engine Capacity:', vh.engineCapacity);
    console.log('Doors:', vh.doors);
    console.log('Seats:', vh.seats);
    console.log('Emission Class:', vh.emissionClass);
    console.log('CO2 Emissions:', vh.co2Emissions);
    console.log('Urban MPG:', vh.urbanMpg);
    console.log('Extra Urban MPG:', vh.extraUrbanMpg);
    console.log('Combined MPG:', vh.combinedMpg);
    console.log('Insurance Group:', vh.insuranceGroup);
    console.log('Annual Tax:', vh.annualTax);
    console.log('Previous Owners:', vh.numberOfOwners || vh.previousOwners);
    console.log('Write-off Category:', vh.writeOffCategory);
    console.log('Is Stolen:', vh.isStolen);
    console.log('Outstanding Finance:', vh.hasOutstandingFinance);
    
    console.log('\n💰 VALUATION FROM API:');
    if (vh.valuation) {
      console.log('Private Price:', vh.valuation.privatePrice);
      console.log('Dealer Price:', vh.valuation.dealerPrice);
      console.log('Part Exchange:', vh.valuation.partExchangePrice);
    } else {
      console.log('❌ No valuation data');
    }
    
    console.log('\n📊 WHAT GOT SAVED TO CAR (Car Collection):');
    console.log('='.repeat(100));
    console.log('Registration:', car.registrationNumber);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Year:', car.year);
    console.log('Color:', car.color);
    console.log('Body Type:', car.bodyType);
    console.log('Transmission:', car.transmission);
    console.log('Engine Size:', car.engineSize);
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    console.log('Emission Class:', car.emissionClass);
    console.log('Mileage:', car.mileage);
    console.log('Price:', car.price);
    
    console.log('\n🏃 RUNNING COSTS IN CAR:');
    if (car.runningCosts) {
      console.log('Urban MPG:', car.runningCosts.fuelEconomy?.urban);
      console.log('Extra Urban MPG:', car.runningCosts.fuelEconomy?.extraUrban);
      console.log('Combined MPG:', car.runningCosts.fuelEconomy?.combined);
      console.log('CO2 Emissions:', car.runningCosts.co2Emissions);
      console.log('Insurance Group:', car.runningCosts.insuranceGroup);
      console.log('Annual Tax:', car.runningCosts.annualTax);
    } else {
      console.log('❌ No running costs');
    }
    
    console.log('\n🔧 MOT DATA IN CAR:');
    console.log('MOT Status:', car.motStatus);
    console.log('MOT Due:', car.motDue);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('MOT History Count:', car.motHistory?.length || 0);
    
    if (car.motHistory && car.motHistory.length > 0) {
      console.log('\nLatest MOT Test:');
      const latest = car.motHistory[0];
      console.log('  Test Date:', latest.testDate);
      console.log('  Expiry Date:', latest.expiryDate);
      console.log('  Result:', latest.testResult);
      console.log('  Mileage:', latest.odometerValue, latest.odometerUnit);
    }
    
    // COMPARISON
    console.log('\n\n🔍 API vs DATABASE - FIELD BY FIELD COMPARISON:');
    console.log('='.repeat(100));
    console.log('Field'.padEnd(25) + 'API (VehicleHistory)'.padEnd(30) + 'Database (Car)'.padEnd(30) + 'Saved?');
    console.log('-'.repeat(100));
    
    const compare = (field, apiValue, dbValue) => {
      const saved = String(apiValue).toLowerCase().trim() === String(dbValue).toLowerCase().trim();
      const status = saved ? '✅ YES' : '❌ NO';
      console.log(
        field.padEnd(25) + 
        String(apiValue || 'NULL').padEnd(30) + 
        String(dbValue || 'NULL').padEnd(30) + 
        status
      );
      return saved;
    };
    
    let savedCount = 0;
    let totalCount = 0;
    
    savedCount += compare('Make', vh.make, car.make) ? 1 : 0; totalCount++;
    savedCount += compare('Model', vh.model, car.model) ? 1 : 0; totalCount++;
    savedCount += compare('Variant', vh.variant, car.variant) ? 1 : 0; totalCount++;
    savedCount += compare('Year', vh.yearOfManufacture, car.year) ? 1 : 0; totalCount++;
    savedCount += compare('Color', vh.colour, car.color) ? 1 : 0; totalCount++;
    savedCount += compare('Body Type', vh.bodyType, car.bodyType) ? 1 : 0; totalCount++;
    savedCount += compare('Transmission', vh.transmission, car.transmission) ? 1 : 0; totalCount++;
    savedCount += compare('Engine Capacity', vh.engineCapacity, car.engineSize) ? 1 : 0; totalCount++;
    savedCount += compare('Doors', vh.doors, car.doors) ? 1 : 0; totalCount++;
    savedCount += compare('Seats', vh.seats, car.seats) ? 1 : 0; totalCount++;
    savedCount += compare('Emission Class', vh.emissionClass, car.emissionClass) ? 1 : 0; totalCount++;
    savedCount += compare('Urban MPG', vh.urbanMpg, car.runningCosts?.fuelEconomy?.urban) ? 1 : 0; totalCount++;
    savedCount += compare('Extra Urban MPG', vh.extraUrbanMpg, car.runningCosts?.fuelEconomy?.extraUrban) ? 1 : 0; totalCount++;
    savedCount += compare('Combined MPG', vh.combinedMpg, car.runningCosts?.fuelEconomy?.combined) ? 1 : 0; totalCount++;
    savedCount += compare('CO2 Emissions', vh.co2Emissions, car.runningCosts?.co2Emissions) ? 1 : 0; totalCount++;
    savedCount += compare('Insurance Group', vh.insuranceGroup, car.runningCosts?.insuranceGroup) ? 1 : 0; totalCount++;
    savedCount += compare('Annual Tax', vh.annualTax, car.runningCosts?.annualTax) ? 1 : 0; totalCount++;
    
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(100));
    console.log(`Total Fields: ${totalCount}`);
    console.log(`✅ Properly Saved: ${savedCount} (${Math.round(savedCount/totalCount*100)}%)`);
    console.log(`❌ Not Saved: ${totalCount - savedCount} (${Math.round((totalCount-savedCount)/totalCount*100)}%)`);
    
    // IDENTIFY ISSUES
    console.log('\n\n⚠️  FIELDS NOT SAVED FROM API:');
    console.log('='.repeat(100));
    
    let issueCount = 0;
    
    if (vh.colour && !car.color) {
      issueCount++;
      console.log(`${issueCount}. Color: API has "${vh.colour}" but Car has "${car.color || 'NULL'}"`);
    }
    
    if (vh.emissionClass && !car.emissionClass) {
      issueCount++;
      console.log(`${issueCount}. Emission Class: API has "${vh.emissionClass}" but Car has "${car.emissionClass || 'NULL'}"`);
    }
    
    if (vh.insuranceGroup && !car.runningCosts?.insuranceGroup) {
      issueCount++;
      console.log(`${issueCount}. Insurance Group: API has "${vh.insuranceGroup}" but Car has "${car.runningCosts?.insuranceGroup || 'NULL'}"`);
    }
    
    // Check MOT data
    console.log('\n\n🔧 MOT DATA ANALYSIS:');
    console.log('='.repeat(100));
    
    if (car.motHistory && car.motHistory.length > 0) {
      const latestMOT = car.motHistory[0];
      const motExpiryFromHistory = latestMOT.expiryDate;
      const motExpiryInCar = car.motDue || car.motExpiry;
      
      console.log('Latest MOT Expiry (from motHistory):', motExpiryFromHistory);
      console.log('MOT Due/Expiry (in car fields):', motExpiryInCar);
      
      if (motExpiryFromHistory && motExpiryInCar) {
        const historyDate = new Date(motExpiryFromHistory).toISOString().split('T')[0];
        const carDate = new Date(motExpiryInCar).toISOString().split('T')[0];
        
        if (historyDate !== carDate) {
          console.log('\n❌ MOT DATE MISMATCH:');
          console.log(`   motHistory[0].expiryDate: ${historyDate}`);
          console.log(`   car.motDue/motExpiry: ${carDate}`);
          console.log(`   Difference: ${Math.abs(new Date(historyDate) - new Date(carDate)) / (1000*60*60*24)} days`);
        } else {
          console.log('\n✅ MOT dates match');
        }
      }
      
      // Check mileage from MOT
      const motMileage = latestMOT.odometerValue;
      const carMileage = car.mileage;
      
      console.log('\nMileage from latest MOT:', motMileage);
      console.log('Mileage in car record:', carMileage);
      
      if (motMileage !== carMileage) {
        console.log('\n❌ MILEAGE NOT UPDATED FROM MOT:');
        console.log(`   MOT shows: ${motMileage} miles`);
        console.log(`   Car has: ${carMileage} miles`);
        console.log(`   Difference: ${Math.abs(motMileage - carMileage)} miles`);
      } else {
        console.log('\n✅ Mileage matches MOT record');
      }
    }
    
    console.log('\n\n💡 CONCLUSION:');
    console.log('='.repeat(100));
    
    if (issueCount === 0 && savedCount === totalCount) {
      console.log('✅ API data is being saved correctly!');
    } else {
      console.log(`⚠️  ${issueCount} fields from API are NOT being saved to Car record`);
      console.log(`⚠️  ${totalCount - savedCount} fields have mismatches`);
      console.log('\nREASON: Comprehensive service is not merging all fields properly');
      console.log('SOLUTION: Already fixed in comprehensiveVehicleService.js');
      console.log('ACTION: Run fixAllIncompleteCars.js to fix existing cars');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAPIvsDatabase();
