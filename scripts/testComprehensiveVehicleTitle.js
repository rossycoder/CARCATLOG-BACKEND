require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

// Simulate the frontend title generation function
function generateComprehensiveVehicleTitle(car) {
  const parts = [];
  
  // For NON-ELECTRIC vehicles: Add engine size first
  if (car.fuelType !== 'Electric' && car.engineSize) {
    const size = parseFloat(car.engineSize);
    if (!isNaN(size) && size > 0) {
      parts.push(size.toFixed(1));
    }
  }
  
  // Add variant if available (contains fuel type + trim like "i-DTEC ES GT" or "M50")
  if (car.variant && car.variant !== 'null' && car.variant !== 'undefined') {
    parts.push(car.variant);
  }
  
  // For ELECTRIC vehicles: Add battery capacity
  if (car.fuelType === 'Electric') {
    const batteryCapacity = car.batteryCapacity || car.runningCosts?.batteryCapacity;
    if (batteryCapacity) {
      parts.push(`${batteryCapacity}kWh`);
    }
  }
  
  // Add body type (Gran Coupe, Tourer, Estate, etc.)
  if (car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined') {
    parts.push(car.bodyType);
  }
  
  // Add transmission (Auto/Manual)
  if (car.transmission) {
    const trans = car.transmission.toLowerCase();
    if (trans === 'automatic' || trans === 'auto') {
      parts.push('Auto');
    } else if (trans === 'manual') {
      parts.push('Manual');
    } else {
      parts.push(car.transmission);
    }
  }
  
  // Add emission class (Euro 5, Euro 6, etc.) - for non-electric vehicles
  if (car.fuelType !== 'Electric' && car.emissionClass && car.emissionClass.includes('Euro')) {
    parts.push(car.emissionClass);
  }
  
  // Add drive type if available (AWD, FWD, RWD, 4WD)
  if (car.driveType) {
    parts.push(car.driveType);
  }
  
  // Add doors (5dr, 3dr, etc.)
  if (car.doors) {
    parts.push(`${car.doors}dr`);
  }
  
  return parts.length > 0 ? parts.join(' ') : null;
}

async function testComprehensiveVehicleTitle() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Find a Honda Accord (non-electric)
    console.log('🔍 Test 1: Honda Accord (Non-Electric)');
    console.log('=====================================');
    const honda = await Car.findOne({
      make: { $regex: /honda/i },
      model: { $regex: /accord/i }
    });

    if (honda) {
      console.log('Make:', honda.make);
      console.log('Model:', honda.model);
      console.log('Variant:', honda.variant);
      console.log('Engine Size:', honda.engineSize);
      console.log('Body Type:', honda.bodyType);
      console.log('Transmission:', honda.transmission);
      console.log('Emission Class:', honda.emissionClass);
      console.log('Doors:', honda.doors);
      console.log('Fuel Type:', honda.fuelType);
      
      const title = generateComprehensiveVehicleTitle(honda);
      console.log('\n🎯 Generated Title:', title);
      console.log('✅ Expected: "2.2 i-DTEC ES GT Tourer Euro 5 5dr"');
    } else {
      console.log('⚠️  Honda Accord not found in database');
    }

    // Test 2: Find BMW i4 (electric)
    console.log('\n\n🔍 Test 2: BMW i4 M50 (Electric)');
    console.log('=====================================');
    const bmw = await Car.findOne({
      make: 'BMW',
      model: 'i4',
      variant: { $regex: /M50/i }
    });

    if (bmw) {
      console.log('Make:', bmw.make);
      console.log('Model:', bmw.model);
      console.log('Variant:', bmw.variant);
      console.log('Battery Capacity:', bmw.batteryCapacity || bmw.runningCosts?.batteryCapacity, 'kWh');
      console.log('Body Type:', bmw.bodyType);
      console.log('Transmission:', bmw.transmission);
      console.log('Drive Type:', bmw.driveType);
      console.log('Doors:', bmw.doors);
      console.log('Fuel Type:', bmw.fuelType);
      
      const title = generateComprehensiveVehicleTitle(bmw);
      console.log('\n🎯 Generated Title:', title);
      console.log('✅ Expected: "M50 83.9kWh Gran Coupe Auto AWD 5dr"');
    } else {
      console.log('⚠️  BMW i4 M50 not found in database');
    }

    // Test 3: Find any other car
    console.log('\n\n🔍 Test 3: Random Car Sample');
    console.log('=====================================');
    const randomCar = await Car.findOne({ 
      advertStatus: 'active',
      fuelType: { $ne: 'Electric' }
    }).limit(1);

    if (randomCar) {
      console.log('Make:', randomCar.make);
      console.log('Model:', randomCar.model);
      console.log('Variant:', randomCar.variant);
      console.log('Engine Size:', randomCar.engineSize);
      console.log('Body Type:', randomCar.bodyType);
      console.log('Transmission:', randomCar.transmission);
      console.log('Emission Class:', randomCar.emissionClass);
      console.log('Doors:', randomCar.doors);
      console.log('Fuel Type:', randomCar.fuelType);
      
      const title = generateComprehensiveVehicleTitle(randomCar);
      console.log('\n🎯 Generated Title:', title);
    } else {
      console.log('⚠️  No active cars found');
    }

    await mongoose.connection.close();
    console.log('\n\n✅ Test completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testComprehensiveVehicleTitle();
