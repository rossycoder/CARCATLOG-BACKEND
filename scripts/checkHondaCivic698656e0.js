require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkHondaCivic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const carId = '698656e06d5ac770c5c18002';
    
    console.log('🔍 HONDA CIVIC DATA CHECK');
    console.log('='.repeat(100));
    console.log(`Car ID: ${carId}`);
    console.log('Expected: 2009 HONDA Civic');
    console.log('='.repeat(100));
    
    // Fetch car and history
    const car = await Car.findById(carId).populate('historyCheckId').lean();
    
    if (!car) {
      console.log('❌ Car not found in database');
      process.exit(1);
    }

    console.log('\n📋 CAR DATA IN DATABASE:');
    console.log('='.repeat(100));
    console.log('Registration:', car.registrationNumber);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
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
    
    console.log('\n🏃 RUNNING COSTS:');
    if (car.runningCosts) {
      console.log('Urban MPG:', car.runningCosts.fuelEconomy?.urban);
      console.log('Extra Urban MPG:', car.runningCosts.fuelEconomy?.extraUrban);
      console.log('Combined MPG:', car.runningCosts.fuelEconomy?.combined);
      console.log('CO2 Emissions:', car.runningCosts.co2Emissions);
      console.log('Insurance Group:', car.runningCosts.insuranceGroup);
      console.log('Annual Tax:', car.runningCosts.annualTax);
    } else {
      console.log('❌ No running costs data');
    }
    
    console.log('\n🔧 MOT DATA:');
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
    
    console.log('\n📍 LOCATION:');
    console.log('Postcode:', car.postcode);
    console.log('Location Name:', car.locationName);
    console.log('Latitude:', car.latitude);
    console.log('Longitude:', car.longitude);
    
    console.log('\n🔗 VEHICLE HISTORY:');
    if (car.historyCheckId) {
      const vh = car.historyCheckId;
      console.log('History Check ID:', vh._id);
      console.log('VRM:', vh.vrm);
      console.log('Make:', vh.make);
      console.log('Model:', vh.model);
      console.log('Variant:', vh.variant);
      console.log('Color:', vh.colour);
      console.log('Body Type:', vh.bodyType);
      console.log('Doors:', vh.doors);
      console.log('Seats:', vh.seats);
      console.log('Engine Capacity:', vh.engineCapacity);
      console.log('Transmission:', vh.transmission);
      console.log('Emission Class:', vh.emissionClass);
      console.log('Previous Owners:', vh.numberOfOwners || vh.previousOwners);
      console.log('Write-off Category:', vh.writeOffCategory);
    } else {
      console.log('❌ No vehicle history linked');
    }
    
    // DATA COMPLETENESS CHECK
    console.log('\n\n📊 DATA COMPLETENESS CHECK:');
    console.log('='.repeat(100));
    
    const checks = {
      'Make': car.make && car.make !== 'Unknown',
      'Model': car.model && car.model !== 'Unknown',
      'Variant': car.variant && car.variant !== 'null' && car.variant !== 'undefined' && !car.variant.match(/^\d+(\.\d+)?L?\s*(Diesel|Petrol)$/i),
      'Year': car.year && car.year > 1900,
      'Price': car.price && car.price > 0,
      'Mileage': car.mileage && car.mileage >= 0,
      'Color': car.color && car.color !== 'null' && car.color !== 'Not specified',
      'Transmission': car.transmission && car.transmission !== 'null',
      'Fuel Type': car.fuelType && car.fuelType !== 'null',
      'Body Type': car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined',
      'Engine Size': car.engineSize && car.engineSize > 0,
      'Doors': car.doors && car.doors > 0,
      'Seats': car.seats && car.seats > 0,
      'Emission Class': car.emissionClass && car.emissionClass !== 'null',
      'Running Costs': car.runningCosts && (car.runningCosts.fuelEconomy?.combined || car.runningCosts.annualTax),
      'MOT Data': (car.motDue || car.motExpiry) || (car.motHistory && car.motHistory.length > 0),
      'Location': car.locationName && car.latitude && car.longitude,
      'Vehicle History': car.historyCheckId !== null
    };
    
    let completeCount = 0;
    let totalCount = Object.keys(checks).length;
    
    for (const [field, isComplete] of Object.entries(checks)) {
      const status = isComplete ? '✅' : '❌';
      console.log(`${status} ${field}`);
      if (isComplete) completeCount++;
    }
    
    console.log('\n📊 Completeness Score:', `${completeCount}/${totalCount}`, `(${Math.round(completeCount/totalCount*100)}%)`);
    
    // ISSUES
    console.log('\n\n⚠️  ISSUES FOUND:');
    console.log('='.repeat(100));
    
    let issueCount = 0;
    
    if (!checks['Variant']) {
      issueCount++;
      console.log(`${issueCount}. ❌ Variant is missing or generic`);
      console.log(`   Current: "${car.variant}"`);
      if (car.historyCheckId?.variant) {
        console.log(`   Available in History: "${car.historyCheckId.variant}"`);
      }
    }
    
    if (!checks['Color']) {
      issueCount++;
      console.log(`${issueCount}. ❌ Color is missing`);
      console.log(`   Current: "${car.color}"`);
      if (car.historyCheckId?.colour) {
        console.log(`   Available in History: "${car.historyCheckId.colour}"`);
      }
    }
    
    if (!checks['Doors']) {
      issueCount++;
      console.log(`${issueCount}. ❌ Doors is missing`);
      if (car.historyCheckId?.doors) {
        console.log(`   Available in History: ${car.historyCheckId.doors}`);
      }
    }
    
    if (!checks['Seats']) {
      issueCount++;
      console.log(`${issueCount}. ❌ Seats is missing`);
      if (car.historyCheckId?.seats) {
        console.log(`   Available in History: ${car.historyCheckId.seats}`);
      }
    }
    
    if (!checks['Body Type']) {
      issueCount++;
      console.log(`${issueCount}. ❌ Body Type is missing`);
      if (car.historyCheckId?.bodyType) {
        console.log(`   Available in History: "${car.historyCheckId.bodyType}"`);
      }
    }
    
    if (!checks['Emission Class']) {
      issueCount++;
      console.log(`${issueCount}. ❌ Emission Class is missing`);
      if (car.historyCheckId?.emissionClass) {
        console.log(`   Available in History: "${car.historyCheckId.emissionClass}"`);
      }
    }
    
    // SUMMARY
    console.log('\n\n✅ SUMMARY:');
    console.log('='.repeat(100));
    
    if (issueCount === 0) {
      console.log('🎉 All data is complete and correct!');
    } else {
      console.log(`⚠️  Found ${issueCount} issues that need fixing`);
      console.log('\n💡 SOLUTION:');
      console.log('Run: node backend/scripts/fixAllIncompleteCars.js');
      console.log('This will automatically fix all missing fields from VehicleHistory');
    }
    
    console.log(`\nData Completeness: ${Math.round(completeCount/totalCount*100)}%`);
    console.log(`Issues: ${issueCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkHondaCivic();
