require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const carId = '69865c026d5ac770c5c181a4';
    
    console.log('🔍 CAR DATA CHECK');
    console.log('='.repeat(100));
    console.log(`Car ID: ${carId}`);
    console.log('='.repeat(100));
    
    const car = await Car.findById(carId).populate('historyCheckId').lean();
    
    if (!car) {
      console.log('❌ Car not found in database');
      process.exit(1);
    }

    console.log('\n📋 BASIC INFO:');
    console.log('Registration:', car.registrationNumber);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Year:', car.year);
    console.log('Price:', `£${car.price}`);
    console.log('Mileage:', `${car.mileage} miles`);
    
    console.log('\n🚗 VEHICLE SPECS:');
    console.log('Color:', car.color);
    console.log('Transmission:', car.transmission);
    console.log('Fuel Type:', car.fuelType);
    console.log('Body Type:', car.bodyType);
    console.log('Engine Size:', car.engineSize ? `${car.engineSize}L` : 'N/A');
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    console.log('Emission Class:', car.emissionClass);
    
    console.log('\n🏃 RUNNING COSTS:');
    if (car.runningCosts) {
      console.log('Urban MPG:', car.runningCosts.fuelEconomy?.urban || 'N/A');
      console.log('Extra Urban MPG:', car.runningCosts.fuelEconomy?.extraUrban || 'N/A');
      console.log('Combined MPG:', car.runningCosts.fuelEconomy?.combined || 'N/A');
      console.log('CO2 Emissions:', car.runningCosts.co2Emissions ? `${car.runningCosts.co2Emissions}g/km` : 'N/A');
      console.log('Insurance Group:', car.runningCosts.insuranceGroup || 'N/A');
      console.log('Annual Tax:', car.runningCosts.annualTax ? `£${car.runningCosts.annualTax}` : 'N/A');
    } else {
      console.log('❌ No running costs data');
    }
    
    console.log('\n🔧 MOT DATA:');
    console.log('MOT Status:', car.motStatus || 'N/A');
    console.log('MOT Due:', car.motDue ? new Date(car.motDue).toLocaleDateString('en-GB') : 'N/A');
    console.log('MOT Expiry:', car.motExpiry ? new Date(car.motExpiry).toLocaleDateString('en-GB') : 'N/A');
    console.log('MOT History Count:', car.motHistory?.length || 0);
    
    if (car.motHistory && car.motHistory.length > 0) {
      console.log('\nLatest MOT:');
      const latest = car.motHistory[0];
      console.log('  Test Date:', new Date(latest.testDate).toLocaleDateString('en-GB'));
      console.log('  Expiry Date:', latest.expiryDate ? new Date(latest.expiryDate).toLocaleDateString('en-GB') : 'N/A');
      console.log('  Result:', latest.testResult);
      console.log('  Mileage:', `${latest.odometerValue} ${latest.odometerUnit}`);
    }
    
    console.log('\n📍 LOCATION:');
    console.log('Postcode:', car.postcode);
    console.log('Location:', car.locationName);
    console.log('Coordinates:', car.latitude && car.longitude ? `${car.latitude}, ${car.longitude}` : 'N/A');
    
    console.log('\n🔗 VEHICLE HISTORY:');
    if (car.historyCheckId) {
      const vh = car.historyCheckId;
      console.log('✅ Linked to VehicleHistory');
      console.log('VRM:', vh.vrm);
      console.log('Variant (from history):', vh.variant);
      console.log('Doors (from history):', vh.doors);
      console.log('Seats (from history):', vh.seats);
      console.log('Body Type (from history):', vh.bodyType);
      console.log('Emission Class (from history):', vh.emissionClass);
      console.log('Previous Owners:', vh.numberOfOwners || vh.previousOwners || 'N/A');
      console.log('Write-off Category:', vh.writeOffCategory || 'none');
    } else {
      console.log('❌ No vehicle history linked');
    }
    
    // COMPLETENESS CHECK
    console.log('\n\n📊 DATA COMPLETENESS:');
    console.log('='.repeat(100));
    
    const checks = {
      'Make': car.make && car.make !== 'Unknown',
      'Model': car.model && car.model !== 'Unknown',
      'Variant': car.variant && car.variant !== 'null' && car.variant !== 'undefined' && !car.variant.match(/^\d+(\.\d+)?L?\s*(Diesel|Petrol|Electric)$/i),
      'Year': car.year && car.year > 1900,
      'Price': car.price && car.price > 0,
      'Mileage': car.mileage !== null && car.mileage !== undefined,
      'Color': car.color && car.color !== 'null' && car.color !== 'Not specified',
      'Transmission': car.transmission && car.transmission !== 'null',
      'Fuel Type': car.fuelType && car.fuelType !== 'null',
      'Body Type': car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined',
      'Engine Size': car.engineSize && car.engineSize > 0,
      'Doors': car.doors && car.doors > 0,
      'Seats': car.seats && car.seats > 0,
      'Emission Class': car.emissionClass && car.emissionClass !== 'null' && car.emissionClass !== 'undefined',
      'Running Costs': car.runningCosts && (car.runningCosts.fuelEconomy?.combined || car.runningCosts.annualTax),
      'MOT Data': (car.motDue || car.motExpiry) || (car.motHistory && car.motHistory.length > 0),
      'Location': car.locationName && car.latitude && car.longitude,
      'Vehicle History': car.historyCheckId !== null
    };
    
    let completeCount = 0;
    let totalCount = Object.keys(checks).length;
    
    for (const [field, isComplete] of Object.entries(checks)) {
      const status = isComplete ? '✅' : '❌';
      const value = car[field.toLowerCase().replace(' ', '')] || 'N/A';
      console.log(`${status} ${field.padEnd(20)} ${typeof value === 'object' ? 'Present' : value}`);
      if (isComplete) completeCount++;
    }
    
    const percentage = Math.round(completeCount/totalCount*100);
    console.log('\n📊 Score:', `${completeCount}/${totalCount} (${percentage}%)`);
    
    // ISSUES
    const missingFields = Object.entries(checks).filter(([_, isComplete]) => !isComplete).map(([field]) => field);
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  MISSING FIELDS:');
      console.log('='.repeat(100));
      missingFields.forEach((field, index) => {
        console.log(`${index + 1}. ❌ ${field}`);
        
        // Check if available in VehicleHistory
        if (car.historyCheckId) {
          const fieldMap = {
            'Variant': 'variant',
            'Doors': 'doors',
            'Seats': 'seats',
            'Body Type': 'bodyType',
            'Emission Class': 'emissionClass',
            'Color': 'colour'
          };
          
          const vhField = fieldMap[field];
          if (vhField && car.historyCheckId[vhField]) {
            console.log(`   ✅ Available in VehicleHistory: ${car.historyCheckId[vhField]}`);
          }
        }
      });
      
      console.log('\n💡 FIX:');
      console.log('Run: node backend/scripts/fixAllIncompleteCars.js');
    } else {
      console.log('\n🎉 ALL DATA COMPLETE!');
    }
    
    // GRADE
    console.log('\n\n🎯 OVERALL GRADE:');
    console.log('='.repeat(100));
    if (percentage >= 95) {
      console.log('🌟 EXCELLENT (95-100%) - Almost perfect!');
    } else if (percentage >= 85) {
      console.log('✅ GOOD (85-94%) - Minor issues');
    } else if (percentage >= 70) {
      console.log('⚠️  FAIR (70-84%) - Some issues');
    } else {
      console.log('❌ POOR (<70%) - Major issues');
    }
    
    console.log(`\nCompleteness: ${percentage}%`);
    console.log(`Missing: ${missingFields.length} fields`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCar();
