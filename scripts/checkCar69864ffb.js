require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCarData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '69864ffba41026f9288bb44c';
    
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
    console.log('Mileage:', car.mileage);
    console.log('Color:', car.color);
    console.log('Transmission:', car.transmission);
    console.log('Fuel Type:', car.fuelType);
    console.log('Body Type:', car.bodyType);
    console.log('Engine Size:', car.engineSize);
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    
    console.log('\n🔗 HISTORY CHECK DATA:');
    if (car.historyCheckId) {
      console.log('History Check ID:', car.historyCheckId._id);
      console.log('VRM:', car.historyCheckId.vrm);
      console.log('Make:', car.historyCheckId.make);
      console.log('Model:', car.historyCheckId.model);
      console.log('Variant from History:', car.historyCheckId.variant);
      console.log('Color from History:', car.historyCheckId.colour);
      console.log('Body Type from History:', car.historyCheckId.bodyType);
      console.log('Doors from History:', car.historyCheckId.doors);
      console.log('Seats from History:', car.historyCheckId.seats);
      console.log('Engine Capacity:', car.historyCheckId.engineCapacity);
      console.log('Transmission:', car.historyCheckId.transmission);
    } else {
      console.log('❌ No history check data');
    }
    
    console.log('\n🎯 VARIANT ANALYSIS:');
    console.log('='.repeat(80));
    console.log('Car.variant:', car.variant || '❌ NULL/MISSING');
    console.log('HistoryCheck.variant:', car.historyCheckId?.variant || '❌ NULL/MISSING');
    
    if (!car.variant && car.historyCheckId?.variant) {
      console.log('\n⚠️  ISSUE FOUND: Variant exists in history check but NOT in car record!');
      console.log('   History has:', car.historyCheckId.variant);
      console.log('   Car has:', car.variant);
    } else if (!car.variant && !car.historyCheckId?.variant) {
      console.log('\n⚠️  ISSUE: Variant is missing from BOTH car and history check!');
      console.log('   This means the API did not return variant data.');
    } else if (car.variant) {
      console.log('\n✅ Variant is properly saved in car record');
    }
    
    console.log('\n📊 DATA COMPLETENESS:');
    console.log('='.repeat(80));
    
    const checks = {
      'Variant': car.variant && car.variant !== 'null' && car.variant !== 'undefined',
      'Doors': car.doors !== null && car.doors !== undefined,
      'Seats': car.seats !== null && car.seats !== undefined,
      'Body Type': car.bodyType && car.bodyType !== 'null',
      'Engine Size': car.engineSize !== null && car.engineSize !== undefined,
      'Color': car.color && car.color !== 'null' && car.color !== 'Not specified',
      'Transmission': car.transmission && car.transmission !== 'null'
    };
    
    for (const [field, isComplete] of Object.entries(checks)) {
      console.log(`${isComplete ? '✅' : '❌'} ${field}`);
    }
    
    // Check if we can fix it from history
    console.log('\n🔧 CAN WE FIX FROM HISTORY?');
    console.log('='.repeat(80));
    
    if (!car.variant && car.historyCheckId?.variant) {
      console.log('✅ YES - Variant available in history:', car.historyCheckId.variant);
    } else if (!car.variant) {
      console.log('❌ NO - Variant not available in history either');
      console.log('   API did not provide variant data for this vehicle');
    }
    
    if (!car.color && car.historyCheckId?.colour) {
      console.log('✅ YES - Color available in history:', car.historyCheckId.colour);
    }
    
    if (!car.doors && car.historyCheckId?.doors) {
      console.log('✅ YES - Doors available in history:', car.historyCheckId.doors);
    }
    
    if (!car.seats && car.historyCheckId?.seats) {
      console.log('✅ YES - Seats available in history:', car.historyCheckId.seats);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCarData();
