require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testElectricVehicleTitle() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find BMW i4 M50
    console.log('🔍 Finding BMW i4 M50...');
    const bmwi4 = await Car.findOne({
      make: 'BMW',
      model: 'i4',
      variant: { $regex: /M50/i }
    });

    if (!bmwi4) {
      console.log('❌ BMW i4 M50 not found in database');
      process.exit(1);
    }

    console.log('\n📊 BMW i4 M50 Current Data:');
    console.log('=====================================');
    console.log('Make:', bmwi4.make);
    console.log('Model:', bmwi4.model);
    console.log('Variant:', bmwi4.variant);
    console.log('Battery Capacity:', bmwi4.batteryCapacity || bmwi4.runningCosts?.batteryCapacity, 'kWh');
    console.log('Body Type:', bmwi4.bodyType);
    console.log('Transmission:', bmwi4.transmission);
    console.log('Drive Type:', bmwi4.driveType);
    console.log('Doors:', bmwi4.doors);
    console.log('Fuel Type:', bmwi4.fuelType);

    // Generate title like frontend does
    console.log('\n🎯 Generated Title (AutoTrader Style):');
    console.log('=====================================');
    
    const parts = [];
    
    // Add variant if available
    if (bmwi4.variant && bmwi4.variant !== 'null' && bmwi4.variant !== 'undefined') {
      parts.push(bmwi4.variant);
    }
    
    // Add battery capacity for electric vehicles
    const batteryCapacity = bmwi4.batteryCapacity || bmwi4.runningCosts?.batteryCapacity;
    if (batteryCapacity) {
      parts.push(`${batteryCapacity}kWh`);
    }
    
    // Add body type
    if (bmwi4.bodyType && bmwi4.bodyType !== 'null' && bmwi4.bodyType !== 'undefined') {
      parts.push(bmwi4.bodyType);
    }
    
    // Add transmission
    if (bmwi4.transmission) {
      const trans = bmwi4.transmission.toLowerCase();
      if (trans === 'automatic' || trans === 'auto') {
        parts.push('Auto');
      } else if (trans === 'manual') {
        parts.push('Manual');
      } else {
        parts.push(bmwi4.transmission);
      }
    }
    
    // Add drive type if available (AWD, FWD, RWD, 4WD)
    if (bmwi4.driveType) {
      parts.push(bmwi4.driveType);
    }
    
    // Add doors
    if (bmwi4.doors) {
      parts.push(`${bmwi4.doors}dr`);
    }
    
    const generatedTitle = parts.join(' ');
    console.log('Title:', generatedTitle);
    console.log('\n✅ Expected format: "M50 83.9kWh Gran Coupe Auto AWD 5dr"');
    console.log('📝 Actual format: "' + generatedTitle + '"');

    // Check what's missing
    console.log('\n🔍 Missing Fields Check:');
    console.log('=====================================');
    if (!bmwi4.variant) console.log('❌ Variant is missing');
    if (!batteryCapacity) console.log('❌ Battery capacity is missing');
    if (!bmwi4.bodyType) console.log('❌ Body type is missing');
    if (!bmwi4.transmission) console.log('❌ Transmission is missing');
    if (!bmwi4.driveType) console.log('❌ Drive type is missing');
    if (!bmwi4.doors) console.log('❌ Doors is missing');

    // Check running costs data
    console.log('\n🔋 Electric Vehicle Data:');
    console.log('=====================================');
    console.log('Electric Range:', bmwi4.electricRange || bmwi4.runningCosts?.electricRange, 'miles');
    console.log('Battery Capacity:', bmwi4.batteryCapacity || bmwi4.runningCosts?.batteryCapacity, 'kWh');
    console.log('Home Charging Speed:', bmwi4.homeChargingSpeed || bmwi4.runningCosts?.homeChargingSpeed, 'kW');
    console.log('Public Charging Speed:', bmwi4.publicChargingSpeed || bmwi4.runningCosts?.publicChargingSpeed, 'kW');
    console.log('Rapid Charging Speed:', bmwi4.rapidChargingSpeed || bmwi4.runningCosts?.rapidChargingSpeed, 'kW');
    console.log('Charging Time (10-80%):', bmwi4.chargingTime10to80 || bmwi4.runningCosts?.chargingTime10to80, 'minutes');

    await mongoose.connection.close();
    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testElectricVehicleTitle();
