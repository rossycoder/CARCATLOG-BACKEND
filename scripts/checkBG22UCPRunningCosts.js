/**
 * Check BG22UCP Running Costs Data
 * Car ID from URL: 56351280-e0e0-4179-b9d5-383ec581bf35
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to database\n');

    // Find by advertId from URL
    const advertId = '56351280-e0e0-4179-b9d5-383ec581bf35';
    
    console.log('='.repeat(60));
    console.log('CHECKING CAR: BG22UCP (BMW i4 M50)');
    console.log('Advert ID:', advertId);
    console.log('='.repeat(60));

    const car = await Car.findOne({ advertId: advertId });
    
    if (!car) {
      console.log('❌ Car not found with advertId:', advertId);
      
      // Try finding by registration
      const carByReg = await Car.findOne({ registrationNumber: 'BG22UCP' });
      if (carByReg) {
        console.log('\n✓ Found car by registration instead');
        console.log('   Actual advertId:', carByReg.advertId);
        console.log('   Car ID:', carByReg._id);
        checkCarData(carByReg);
      }
      process.exit(1);
    }

    checkCarData(car);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

function checkCarData(car) {
  console.log('\n📋 BASIC INFO:');
  console.log('   Car ID:', car._id);
  console.log('   Advert ID:', car.advertId);
  console.log('   Registration:', car.registrationNumber);
  console.log('   Make:', car.make);
  console.log('   Model:', car.model);
  console.log('   Year:', car.year);
  console.log('   Fuel Type:', car.fuelType);

  console.log('\n💰 RUNNING COSTS (Nested Object):');
  if (car.runningCosts) {
    console.log('   runningCosts object exists:', typeof car.runningCosts);
    console.log('   Fuel Economy:', car.runningCosts.fuelEconomy);
    console.log('   - Urban:', car.runningCosts.fuelEconomy?.urban);
    console.log('   - Extra Urban:', car.runningCosts.fuelEconomy?.extraUrban);
    console.log('   - Combined:', car.runningCosts.fuelEconomy?.combined);
    console.log('   Insurance Group:', car.runningCosts.insuranceGroup);
    console.log('   Annual Tax:', car.runningCosts.annualTax);
    console.log('   CO2 Emissions:', car.runningCosts.co2Emissions);
    
    // Electric vehicle specific
    if (car.fuelType === 'Electric') {
      console.log('\n🔋 ELECTRIC VEHICLE DATA:');
      console.log('   Electric Range:', car.runningCosts.electricRange);
      console.log('   Battery Capacity:', car.runningCosts.batteryCapacity);
      console.log('   Charging Time:', car.runningCosts.chargingTime);
      console.log('   Home Charging Speed:', car.runningCosts.homeChargingSpeed);
      console.log('   Public Charging Speed:', car.runningCosts.publicChargingSpeed);
      console.log('   Rapid Charging Speed:', car.runningCosts.rapidChargingSpeed);
    }
  } else {
    console.log('   ❌ runningCosts object is NULL/MISSING');
  }

  console.log('\n💰 RUNNING COSTS (Legacy Fields):');
  console.log('   fuelEconomyUrban:', car.fuelEconomyUrban);
  console.log('   fuelEconomyExtraUrban:', car.fuelEconomyExtraUrban);
  console.log('   fuelEconomyCombined:', car.fuelEconomyCombined);
  console.log('   insuranceGroup:', car.insuranceGroup);
  console.log('   annualTax:', car.annualTax);
  console.log('   co2Emissions:', car.co2Emissions);

  console.log('\n📊 DATA SOURCES:');
  console.log('   DVLA:', car.dataSources?.dvla);
  console.log('   CheckCarDetails:', car.dataSources?.checkCarDetails);
  console.log('   Last Updated:', car.dataSources?.lastUpdated);

  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS:');
  console.log('='.repeat(60));

  const issues = [];
  
  if (!car.runningCosts || Object.keys(car.runningCosts).length === 0) {
    issues.push('runningCosts object is empty or missing');
  }
  
  if (!car.runningCosts?.fuelEconomy?.combined && !car.fuelEconomyCombined) {
    issues.push('No MPG data (neither nested nor legacy)');
  }
  
  if (!car.runningCosts?.annualTax && !car.annualTax) {
    issues.push('No annual tax data');
  }
  
  if (!car.runningCosts?.insuranceGroup && !car.insuranceGroup) {
    issues.push('No insurance group data');
  }

  if (issues.length > 0) {
    console.log('\n❌ Issues Found:');
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    
    console.log('\n💡 Solution:');
    console.log('   Run: node backend/scripts/fixBG22UCPCompleteData.js');
  } else {
    console.log('\n✅ All running costs data is present!');
    console.log('   If not showing on frontend, check frontend code.');
  }
}

checkCar();
