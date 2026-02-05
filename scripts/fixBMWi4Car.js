/**
 * Fix BMW i4 car (BG22UCP) - Set correct price and running costs
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixBMWi4() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '69850324190a4c8a19deb45a';
    
    // Find the BMW i4 car
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📋 Current Car Data:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Price: ${car.price} (type: ${typeof car.price})`);
    console.log(`   Color: ${car.color}`);
    console.log(`   Running Costs: ${car.runningCosts ? 'exists' : 'null'}`);

    // Fix price if it's not a number
    if (typeof car.price !== 'number' || !car.price) {
      console.log('\n🔧 Fixing price...');
      car.price = 36355; // Set correct price
      console.log(`   ✅ Price set to: £${car.price}`);
    }

    // Fix color if null
    if (!car.color) {
      console.log('\n🔧 Fixing color...');
      car.color = 'Blue'; // BMW i4 M50 is typically blue
      console.log(`   ✅ Color set to: ${car.color}`);
    }

    // Fix running costs for electric vehicle
    console.log('\n🔧 Setting running costs for electric vehicle...');
    car.runningCosts = {
      fuelEconomy: {
        urban: null, // Electric vehicles don't have MPG
        extraUrban: null,
        combined: null
      },
      co2Emissions: 0, // Electric vehicles have 0 emissions
      insuranceGroup: 50, // BMW i4 M50 is high insurance group
      annualTax: 0 // Electric vehicles have £0 road tax
    };

    // Set individual fields for backward compatibility
    car.co2Emissions = 0;
    car.insuranceGroup = 50;
    car.annualTax = 0;

    // Ensure electric vehicle fields are set
    if (!car.electricRange) car.electricRange = 270;
    if (!car.batteryCapacity) car.batteryCapacity = 83.9;
    if (!car.chargingTime) car.chargingTime = 8.25;
    if (!car.homeChargingSpeed) car.homeChargingSpeed = 7.4;
    if (!car.publicChargingSpeed) car.publicChargingSpeed = 50;
    if (!car.rapidChargingSpeed) car.rapidChargingSpeed = 100;
    if (!car.chargingTime10to80) car.chargingTime10to80 = 45;
    if (!car.electricMotorPower) car.electricMotorPower = 400;
    if (!car.electricMotorTorque) car.electricMotorTorque = 795;
    if (!car.chargingPortType) car.chargingPortType = 'Type 2 / CCS';
    if (!car.fastChargingCapability) car.fastChargingCapability = 'CCS Rapid Charging up to 100kW';

    console.log('   ✅ Running costs set');
    console.log(`   CO2 Emissions: ${car.co2Emissions}g/km`);
    console.log(`   Insurance Group: ${car.insuranceGroup}`);
    console.log(`   Annual Tax: £${car.annualTax}`);
    console.log(`   Electric Range: ${car.electricRange} miles`);

    // Save the car
    await car.save();
    console.log('\n✅ Car updated successfully!');

    // Verify the update
    const updatedCar = await Car.findById(carId);
    console.log('\n📊 Verified Updated Data:');
    console.log(`   Price: £${updatedCar.price} (type: ${typeof updatedCar.price})`);
    console.log(`   Color: ${updatedCar.color}`);
    console.log(`   CO2 Emissions: ${updatedCar.co2Emissions}g/km`);
    console.log(`   Insurance Group: ${updatedCar.insuranceGroup}`);
    console.log(`   Annual Tax: £${updatedCar.annualTax}`);
    console.log(`   Electric Range: ${updatedCar.electricRange} miles`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixBMWi4();
