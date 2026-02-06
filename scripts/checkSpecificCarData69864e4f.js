require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCarData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '69864e4fa41026f9288bb27c';
    
    console.log('\n🔍 Fetching car from database...');
    const car = await Car.findById(carId).populate('historyCheckId').lean();
    
    if (!car) {
      console.log('❌ Car not found in database');
      process.exit(1);
    }

    console.log('\n📋 CAR DATA IN DATABASE:');
    console.log('='.repeat(80));
    console.log('ID:', car._id);
    console.log('Registration:', car.registrationNumber);
    console.log('Make/Model:', `${car.make} ${car.model}`);
    console.log('Variant:', car.variant);
    console.log('Year:', car.year);
    console.log('Price:', car.price);
    console.log('Mileage:', car.mileage);
    console.log('Color:', car.color);
    console.log('Transmission:', car.transmission);
    console.log('Fuel Type:', car.fuelType);
    console.log('Body Type:', car.bodyType);
    console.log('Engine Size:', car.engineSize);
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    console.log('Emission Class:', car.emissionClass);
    
    console.log('\n🔧 MOT DATA:');
    console.log('MOT Status:', car.motStatus);
    console.log('MOT Due:', car.motDue);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('MOT History Count:', car.motHistory?.length || 0);
    
    if (car.motHistory && car.motHistory.length > 0) {
      console.log('\n📅 Latest MOT Record:');
      const latestMOT = car.motHistory[0];
      console.log('  Test Date:', latestMOT.testDate);
      console.log('  Expiry Date:', latestMOT.expiryDate);
      console.log('  Test Result:', latestMOT.testResult);
      console.log('  Odometer:', latestMOT.odometerValue, latestMOT.odometerUnit);
    }
    
    console.log('\n💰 VALUATION DATA:');
    console.log('Estimated Value:', car.estimatedValue);
    console.log('Valuation Object:', JSON.stringify(car.valuation, null, 2));
    
    console.log('\n🏃 RUNNING COSTS:');
    if (car.runningCosts) {
      console.log('Fuel Economy:', car.runningCosts.fuelEconomy);
      console.log('CO2 Emissions:', car.runningCosts.co2Emissions);
      console.log('Insurance Group:', car.runningCosts.insuranceGroup);
      console.log('Annual Tax:', car.runningCosts.annualTax);
    } else {
      console.log('❌ No running costs data');
    }
    
    console.log('\n📍 LOCATION DATA:');
    console.log('Postcode:', car.postcode);
    console.log('Location Name:', car.locationName);
    console.log('Latitude:', car.latitude);
    console.log('Longitude:', car.longitude);
    
    console.log('\n🔗 HISTORY CHECK:');
    console.log('History Check ID:', car.historyCheckId?._id);
    console.log('History Check Date:', car.historyCheckDate);
    
    if (car.historyCheckId) {
      console.log('\n📊 VEHICLE HISTORY DATA:');
      console.log('VRM:', car.historyCheckId.vrm);
      console.log('Previous Owners:', car.historyCheckId.numberOfOwners || car.historyCheckId.previousOwners);
      console.log('Write-off Category:', car.historyCheckId.writeOffCategory);
      console.log('Is Written Off:', car.historyCheckId.isWrittenOff);
      console.log('Has Accident History:', car.historyCheckId.hasAccidentHistory);
      console.log('Is Stolen:', car.historyCheckId.isStolen);
      console.log('Outstanding Finance:', car.historyCheckId.hasOutstandingFinance);
      
      console.log('\n💰 Valuation from History:');
      if (car.historyCheckId.valuation) {
        console.log('  Private Price:', car.historyCheckId.valuation.privatePrice);
        console.log('  Dealer Price:', car.historyCheckId.valuation.dealerPrice);
        console.log('  Part Exchange:', car.historyCheckId.valuation.partExchangePrice);
      }
    }
    
    console.log('\n📊 DATA SOURCES:');
    console.log('Data Sources:', car.dataSources);
    console.log('Last Updated:', car.updatedAt);
    console.log('Created At:', car.createdAt);
    
    console.log('\n🎯 ADVERT STATUS:');
    console.log('Advert Status:', car.advertStatus);
    console.log('Advert ID:', car.advertId);
    console.log('Published At:', car.publishedAt);
    
    // Check if MOT data is properly set
    console.log('\n\n🔍 MOT DATA ANALYSIS:');
    console.log('='.repeat(80));
    
    const hasMOTDue = car.motDue !== null && car.motDue !== undefined;
    const hasMOTExpiry = car.motExpiry !== null && car.motExpiry !== undefined;
    const hasMOTHistory = car.motHistory && car.motHistory.length > 0;
    const hasMOTHistoryExpiry = hasMOTHistory && car.motHistory[0].expiryDate;
    
    console.log('✓ Has motDue field:', hasMOTDue ? '✅ YES' : '❌ NO');
    console.log('✓ Has motExpiry field:', hasMOTExpiry ? '✅ YES' : '❌ NO');
    console.log('✓ Has motHistory array:', hasMOTHistory ? `✅ YES (${car.motHistory.length} records)` : '❌ NO');
    console.log('✓ Has motHistory[0].expiryDate:', hasMOTHistoryExpiry ? '✅ YES' : '❌ NO');
    
    if (!hasMOTDue && !hasMOTExpiry && !hasMOTHistoryExpiry) {
      console.log('\n⚠️  WARNING: No MOT date available in any format!');
      console.log('   Frontend will show: "Contact seller for MOT details"');
    } else {
      console.log('\n✅ MOT date is available');
      if (hasMOTDue) {
        console.log('   Frontend will use: motDue =', car.motDue);
      } else if (hasMOTExpiry) {
        console.log('   Frontend will use: motExpiry =', car.motExpiry);
      } else if (hasMOTHistoryExpiry) {
        console.log('   Frontend will use: motHistory[0].expiryDate =', car.motHistory[0].expiryDate);
      }
    }
    
    // Check if data is complete
    console.log('\n\n🎯 DATA COMPLETENESS CHECK:');
    console.log('='.repeat(80));
    
    const checks = {
      'Variant': car.variant && car.variant !== 'null' && car.variant !== 'undefined',
      'Doors': car.doors !== null && car.doors !== undefined,
      'Seats': car.seats !== null && car.seats !== undefined,
      'Body Type': car.bodyType && car.bodyType !== 'null',
      'Engine Size': car.engineSize !== null && car.engineSize !== undefined,
      'Color': car.color && car.color !== 'null' && car.color !== 'Not specified',
      'Transmission': car.transmission && car.transmission !== 'null',
      'MOT Data': hasMOTDue || hasMOTExpiry || hasMOTHistoryExpiry,
      'Running Costs': car.runningCosts !== null && car.runningCosts !== undefined,
      'Valuation': car.valuation !== null && car.valuation !== undefined,
      'Location': car.locationName && car.latitude && car.longitude,
      'History Check': car.historyCheckId !== null && car.historyCheckId !== undefined
    };
    
    let completeCount = 0;
    let totalCount = Object.keys(checks).length;
    
    for (const [field, isComplete] of Object.entries(checks)) {
      console.log(`${isComplete ? '✅' : '❌'} ${field}`);
      if (isComplete) completeCount++;
    }
    
    console.log('\n📊 Completeness Score:', `${completeCount}/${totalCount}`, `(${Math.round(completeCount/totalCount*100)}%)`);
    
    if (completeCount === totalCount) {
      console.log('🎉 All data is complete!');
    } else {
      console.log('⚠️  Some data is missing. Consider running comprehensive service.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCarData();
