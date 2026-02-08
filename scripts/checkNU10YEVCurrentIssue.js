/**
 * Check NU10YEV Car Data Issue
 * Car ID: 6988cdb3a58c2b355dde9101
 * Issue: Data not saving correctly, running costs showing null
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to database\n');

    const carId = '6988cdb3a58c2b355dde9101';
    
    console.log('='.repeat(60));
    console.log('CHECKING CAR: NU10YEV (SKODA OCTAVIA)');
    console.log('='.repeat(60));

    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found in database!');
      process.exit(1);
    }

    console.log('\n📋 BASIC INFO:');
    console.log('   Registration:', car.registration);
    console.log('   Make:', car.make);
    console.log('   Model:', car.model);
    console.log('   Variant:', car.variant || '❌ MISSING');
    console.log('   Year:', car.year);
    console.log('   Status:', car.status);

    console.log('\n🚗 VEHICLE DETAILS:');
    console.log('   Fuel Type:', car.fuelType || '❌ MISSING');
    console.log('   Body Type:', car.bodyType || '❌ MISSING');
    console.log('   Engine Size:', car.engineSize || '❌ MISSING');
    console.log('   Gearbox:', car.gearbox || '❌ MISSING');
    console.log('   Doors:', car.doors || '❌ MISSING');
    console.log('   Seats:', car.seats || '❌ MISSING');
    console.log('   Color:', car.color || '❌ MISSING');
    console.log('   Mileage:', car.mileage || '❌ MISSING');

    console.log('\n💰 RUNNING COSTS:');
    if (car.runningCosts) {
      console.log('   MPG:', car.runningCosts.mpg || '❌ NULL');
      console.log('   Insurance Group:', car.runningCosts.insuranceGroup || '❌ NULL');
      console.log('   Annual Tax:', car.runningCosts.annualTax || '❌ NULL');
      console.log('   CO2:', car.runningCosts.co2Emissions || '❌ NULL');
    } else {
      console.log('   ❌ RUNNING COSTS OBJECT IS NULL/MISSING');
    }

    console.log('\n🔍 MOT DATA:');
    console.log('   MOT Due Date:', car.motDueDate || '❌ MISSING');
    console.log('   MOT Status:', car.motStatus || '❌ MISSING');

    console.log('\n📊 VEHICLE HISTORY:');
    console.log('   History ID:', car.vehicleHistory || '❌ MISSING');

    console.log('\n💵 PRICING:');
    console.log('   Price:', car.price || '❌ MISSING');
    console.log('   Estimated Value:', car.estimatedValue || '❌ MISSING');

    console.log('\n📍 LOCATION:');
    console.log('   Postcode:', car.postcode || '❌ MISSING');
    console.log('   Location Name:', car.locationName || '❌ MISSING');

    console.log('\n🔧 TECHNICAL DATA:');
    console.log('   VIN:', car.vin || '❌ MISSING');
    console.log('   Engine Code:', car.engineCode || '❌ MISSING');

    console.log('\n📅 TIMESTAMPS:');
    console.log('   Created:', car.createdAt);
    console.log('   Updated:', car.updatedAt);

    // Check what's missing
    console.log('\n' + '='.repeat(60));
    console.log('MISSING DATA SUMMARY:');
    console.log('='.repeat(60));

    const missingFields = [];
    
    if (!car.variant) missingFields.push('variant');
    if (!car.fuelType || car.fuelType === 'Petrol') missingFields.push('fuelType (showing Petrol, should be Diesel)');
    if (!car.bodyType) missingFields.push('bodyType');
    if (!car.engineSize) missingFields.push('engineSize');
    if (!car.gearbox) missingFields.push('gearbox');
    if (!car.doors) missingFields.push('doors');
    if (!car.seats) missingFields.push('seats');
    if (!car.color) missingFields.push('color');
    if (!car.runningCosts || !car.runningCosts.mpg) missingFields.push('runningCosts.mpg');
    if (!car.runningCosts || !car.runningCosts.insuranceGroup) missingFields.push('runningCosts.insuranceGroup');
    if (!car.runningCosts || !car.runningCosts.annualTax) missingFields.push('runningCosts.annualTax');

    if (missingFields.length > 0) {
      console.log('\n❌ Missing Fields:');
      missingFields.forEach(field => console.log(`   - ${field}`));
    } else {
      console.log('\n✓ All fields present');
    }

    // Check raw document
    console.log('\n' + '='.repeat(60));
    console.log('RAW DOCUMENT (for debugging):');
    console.log('='.repeat(60));
    console.log(JSON.stringify(car.toObject(), null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

checkCar();
