/**
 * Check Car by Advert ID
 * Usage: node backend/scripts/checkCarByAdvertId.js <advertId>
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to database\n');

    const advertId = process.argv[2] || '172db192-c0dd-4ee7-8a5d-9bc56a3caef9';
    
    console.log('='.repeat(60));
    console.log('CHECKING CAR BY ADVERT ID');
    console.log('Advert ID:', advertId);
    console.log('='.repeat(60));

    const car = await Car.findOne({ advertId: advertId });
    
    if (!car) {
      console.log('❌ Car not found with advertId:', advertId);
      process.exit(1);
    }

    console.log('\n📋 BASIC INFO:');
    console.log('   Car ID:', car._id);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Make:', car.make);
    console.log('   Model:', car.model);
    console.log('   Year:', car.year);
    console.log('   Fuel Type:', car.fuelType);
    console.log('   Doors:', car.doors);
    console.log('   Seats:', car.seats);
    console.log('   Emission Class:', car.emissionClass || 'NULL');

    console.log('\n💰 RUNNING COSTS (Nested):');
    if (car.runningCosts) {
      console.log('   Urban MPG:', car.runningCosts.fuelEconomy?.urban);
      console.log('   Extra Urban MPG:', car.runningCosts.fuelEconomy?.extraUrban);
      console.log('   Combined MPG:', car.runningCosts.fuelEconomy?.combined);
      console.log('   Insurance Group:', car.runningCosts.insuranceGroup);
      console.log('   Annual Tax:', car.runningCosts.annualTax);
      console.log('   CO2:', car.runningCosts.co2Emissions);
    } else {
      console.log('   ❌ runningCosts object is NULL');
    }

    console.log('\n💰 RUNNING COSTS (Legacy):');
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

    // Check if data needs to be fetched
    const needsFetch = !car.runningCosts?.fuelEconomy?.combined && 
                       !car.fuelEconomyCombined &&
                       !car.runningCosts?.insuranceGroup &&
                       !car.insuranceGroup;

    if (needsFetch) {
      console.log('\n⚠️  RUNNING COSTS MISSING!');
      console.log('\n💡 Solution:');
      console.log(`   Run: node backend/scripts/fixCarByAdvertId.js ${advertId}`);
    } else {
      console.log('\n✅ Running costs data present in database');
      console.log('   If not showing on frontend, check frontend code');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkCar();
