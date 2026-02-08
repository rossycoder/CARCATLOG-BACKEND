/**
 * Fix BG22UCP Complete Data (BMW i4 M50 Electric)
 * Advert ID: 56351280-e0e0-4179-b9d5-383ec581bf35
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

async function fixCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to database\n');

    const advertId = '56351280-e0e0-4179-b9d5-383ec581bf35';
    
    console.log('='.repeat(60));
    console.log('FIXING CAR: BG22UCP (BMW i4 M50 Electric)');
    console.log('='.repeat(60));

    // Find car
    console.log('\n📡 Step 1: Loading car from database...');
    const car = await Car.findOne({ advertId: advertId });
    
    if (!car) {
      console.log('❌ Car not found with advertId:', advertId);
      process.exit(1);
    }

    console.log('✓ Car loaded');
    console.log('   Registration:', car.registrationNumber);
    console.log('   Make:', car.make);
    console.log('   Model:', car.model);
    console.log('   Fuel Type:', car.fuelType);

    // Use universal service to complete the data
    console.log('\n🔄 Step 2: Running universal auto-complete service...');
    const service = new UniversalAutoCompleteService();
    
    try {
      const result = await service.completeCarData(car, true); // force refresh
      console.log('\n✓ Universal service completed!');
    } catch (error) {
      console.error('\n❌ Universal service failed:', error.message);
      console.error(error.stack);
    }

    // Reload car to see updated data
    console.log('\n📊 Step 3: Verifying updated data...');
    const updatedCar = await Car.findOne({ advertId: advertId });

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION - UPDATED CAR DATA:');
    console.log('='.repeat(60));

    console.log('\n📋 BASIC INFO:');
    console.log('   Registration:', updatedCar.registrationNumber);
    console.log('   Make:', updatedCar.make);
    console.log('   Model:', updatedCar.model);
    console.log('   Year:', updatedCar.year);
    console.log('   Fuel Type:', updatedCar.fuelType);

    console.log('\n💰 RUNNING COSTS:');
    console.log('   MPG Combined:', updatedCar.runningCosts?.fuelEconomy?.combined || updatedCar.fuelEconomyCombined || 'N/A (Electric)');
    console.log('   Insurance Group:', updatedCar.runningCosts?.insuranceGroup || updatedCar.insuranceGroup);
    console.log('   Annual Tax:', updatedCar.runningCosts?.annualTax || updatedCar.annualTax);
    console.log('   CO2:', updatedCar.runningCosts?.co2Emissions || updatedCar.co2Emissions);

    if (updatedCar.fuelType === 'Electric') {
      console.log('\n🔋 ELECTRIC VEHICLE DATA:');
      console.log('   Electric Range:', updatedCar.runningCosts?.electricRange || updatedCar.electricRange);
      console.log('   Battery Capacity:', updatedCar.runningCosts?.batteryCapacity || updatedCar.batteryCapacity);
      console.log('   Charging Time (10-80%):', updatedCar.runningCosts?.chargingTime10to80 || updatedCar.chargingTime10to80);
      console.log('   Home Charging:', updatedCar.runningCosts?.homeChargingSpeed || updatedCar.homeChargingSpeed);
      console.log('   Public Charging:', updatedCar.runningCosts?.publicChargingSpeed || updatedCar.publicChargingSpeed);
      console.log('   Rapid Charging:', updatedCar.runningCosts?.rapidChargingSpeed || updatedCar.rapidChargingSpeed);
    }

    // Check what's still missing
    console.log('\n' + '='.repeat(60));
    console.log('FINAL STATUS:');
    console.log('='.repeat(60));

    const stillMissing = [];
    
    if (!updatedCar.runningCosts?.insuranceGroup && !updatedCar.insuranceGroup) {
      stillMissing.push('insuranceGroup');
    }
    if (!updatedCar.runningCosts?.annualTax && !updatedCar.annualTax && updatedCar.annualTax !== 0) {
      stillMissing.push('annualTax');
    }
    
    if (updatedCar.fuelType === 'Electric') {
      if (!updatedCar.runningCosts?.electricRange && !updatedCar.electricRange) {
        stillMissing.push('electricRange');
      }
      if (!updatedCar.runningCosts?.batteryCapacity && !updatedCar.batteryCapacity) {
        stillMissing.push('batteryCapacity');
      }
    }

    if (stillMissing.length > 0) {
      console.log('\n⚠️  Still Missing:');
      stillMissing.forEach(field => console.log(`   - ${field}`));
      console.log('\n💡 Note: Some data may not be available from API for this vehicle');
    } else {
      console.log('\n✅ ALL DATA COMPLETE!');
    }

    console.log('\n🎉 Fix completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh the edit page: /selling/advert/edit/56351280-e0e0-4179-b9d5-383ec581bf35');
    console.log('   2. Running costs should now be populated');
    console.log('   3. If still not showing, check browser console for errors');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

fixCar();
