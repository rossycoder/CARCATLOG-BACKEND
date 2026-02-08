/**
 * Fix NU10YEV Car Complete Data
 * Car ID: 6988cdb3a58c2b355dde9101
 * Issues: Wrong fuel type, missing running costs, missing vehicle details
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

async function fixCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to database\n');

    const carId = '6988cdb3a58c2b355dde9101';
    const registration = 'NU10YEV';
    
    console.log('='.repeat(60));
    console.log('FIXING CAR: NU10YEV (SKODA OCTAVIA)');
    console.log('='.repeat(60));

    // Step 1: Get the car from database
    console.log('\n📡 Step 1: Loading car from database...');
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found!');
      process.exit(1);
    }

    console.log('✓ Car loaded');

    // Step 2: Use universal service to complete the data
    console.log('\n🔄 Step 2: Running universal auto-complete service...');
    const service = new UniversalAutoCompleteService();
    const result = await service.completeCarData(car, true); // force refresh

    console.log('\n✓ Universal service completed!');

    // Step 3: Reload car to see updated data
    console.log('\n📊 Step 3: Verifying updated data...');
    const updatedCar = await Car.findById(carId);

    // Step 3: Verify the update
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION - UPDATED CAR DATA:');
    console.log('='.repeat(60));

    console.log('\n📋 BASIC INFO:');
    console.log('   Registration:', updatedCar.registration || updatedCar.registrationNumber);
    console.log('   Make:', updatedCar.make);
    console.log('   Model:', updatedCar.model);
    console.log('   Variant:', updatedCar.variant);
    console.log('   Year:', updatedCar.year);

    console.log('\n🚗 VEHICLE DETAILS:');
    console.log('   Fuel Type:', updatedCar.fuelType);
    console.log('   Body Type:', updatedCar.bodyType);
    console.log('   Engine Size:', updatedCar.engineSize);
    console.log('   Gearbox:', updatedCar.gearbox);
    console.log('   Doors:', updatedCar.doors);
    console.log('   Seats:', updatedCar.seats);
    console.log('   Color:', updatedCar.color);

    console.log('\n💰 RUNNING COSTS:');
    console.log('   MPG:', updatedCar.runningCosts?.fuelEconomy?.combined || updatedCar.fuelEconomyCombined);
    console.log('   Insurance Group:', updatedCar.runningCosts?.insuranceGroup || updatedCar.insuranceGroup);
    console.log('   Annual Tax:', updatedCar.runningCosts?.annualTax || updatedCar.annualTax);
    console.log('   CO2:', updatedCar.runningCosts?.co2Emissions || updatedCar.co2Emissions);

    // Check what's still missing
    console.log('\n' + '='.repeat(60));
    console.log('FINAL STATUS:');
    console.log('='.repeat(60));

    const stillMissing = [];
    
    if (!updatedCar.fuelType) stillMissing.push('fuelType');
    if (!updatedCar.bodyType) stillMissing.push('bodyType');
    if (!updatedCar.engineSize) stillMissing.push('engineSize');
    if (!updatedCar.gearbox) stillMissing.push('gearbox');
    if (!updatedCar.color) stillMissing.push('color');
    if (!updatedCar.runningCosts?.fuelEconomy?.combined && !updatedCar.fuelEconomyCombined) {
      stillMissing.push('runningCosts.mpg');
    }
    if (!updatedCar.runningCosts?.insuranceGroup && !updatedCar.insuranceGroup) {
      stillMissing.push('runningCosts.insuranceGroup');
    }
    if (!updatedCar.runningCosts?.annualTax && !updatedCar.annualTax) {
      stillMissing.push('runningCosts.annualTax');
    }

    if (stillMissing.length > 0) {
      console.log('\n⚠️  Still Missing:');
      stillMissing.forEach(field => console.log(`   - ${field}`));
    } else {
      console.log('\n✅ ALL DATA COMPLETE!');
    }

    console.log('\n🎉 Fix completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Check frontend: /cars/6988cdb3a58c2b355dde9101');
    console.log('   2. Verify running costs are showing');
    console.log('   3. Verify fuel type shows as Diesel (not Petrol)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

fixCar();
