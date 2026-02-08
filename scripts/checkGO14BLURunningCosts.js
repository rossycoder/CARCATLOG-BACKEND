const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function checkGO14BLURunningCosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    const carId = '69879bb9d4a7f60f5dfb4083';
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('=== CURRENT RUNNING COSTS DATA ===');
    console.log('Running Costs Object:', car.runningCosts);
    
    if (car.runningCosts) {
      console.log('✅ Running costs object exists');
      console.log('Annual Tax:', car.runningCosts.annualTax);
      console.log('Insurance Group:', car.runningCosts.insuranceGroup);
      console.log('Combined MPG:', car.runningCosts.combinedMpg);
      console.log('Urban MPG:', car.runningCosts.urbanMpg);
      console.log('Extra Urban MPG:', car.runningCosts.extraUrbanMpg);
      console.log('CO2 Emissions:', car.runningCosts.co2Emissions);
      console.log('Electric Range:', car.runningCosts.electricRange);
      console.log('Battery Capacity:', car.runningCosts.batteryCapacity);
      console.log('Charging Time:', car.runningCosts.chargingTime);
    } else {
      console.log('❌ Running costs object is null/undefined');
    }

    console.log('\n=== INDIVIDUAL CAR FIELDS ===');
    console.log('Annual Tax (car.annualTax):', car.annualTax);
    console.log('Insurance Group (car.insuranceGroup):', car.insuranceGroup);
    console.log('Combined MPG (car.combinedMpg):', car.combinedMpg);
    console.log('Urban MPG (car.urbanMpg):', car.urbanMpg);
    console.log('Extra Urban MPG (car.extraUrbanMpg):', car.extraUrbanMpg);
    console.log('CO2 Emissions (car.co2Emissions):', car.co2Emissions);
    console.log('Electric Range (car.electricRange):', car.electricRange);
    console.log('Battery Capacity (car.batteryCapacity):', car.batteryCapacity);
    console.log('Charging Time (car.chargingTime):', car.chargingTime);

    console.log('\n=== FIXING RUNNING COSTS ===');
    
    // Update running costs according to schema
    car.runningCosts = {
      fuelEconomy: {
        urban: car.runningCosts?.fuelEconomy?.urban || null,
        extraUrban: car.runningCosts?.fuelEconomy?.extraUrban || null,
        combined: car.runningCosts?.fuelEconomy?.combined || null
      },
      co2Emissions: car.co2Emissions || 0,
      insuranceGroup: car.insuranceGroup || null,
      annualTax: car.annualTax || 195,
      
      // Electric vehicle specific
      electricRange: car.electricRange || 186,
      chargingTime: car.chargingTime || 3.9,
      batteryCapacity: car.batteryCapacity || 35,
      
      // Charging speeds
      homeChargingSpeed: 7.2, // 7.2kW home charging
      publicChargingSpeed: 22, // 22kW public charging
      rapidChargingSpeed: 40, // 40kW rapid charging
      chargingTime10to80: 42, // 42 minutes for 10-80% at 40kW
      
      // Motor specifications
      electricMotorPower: 100, // 100kW motor power
      electricMotorTorque: 290, // 290Nm torque
      chargingPortType: 'Type 2 / CCS',
      fastChargingCapability: '40kW DC Fast Charging'
    };

    await car.save();
    
    console.log('✅ Running costs updated successfully!\n');
    
    console.log('=== UPDATED RUNNING COSTS ===');
    console.log('Annual Tax: £' + car.runningCosts.annualTax);
    console.log('CO2 Emissions: ' + car.runningCosts.co2Emissions + 'g/km');
    console.log('Electric Range: ' + car.runningCosts.electricRange + ' miles');
    console.log('Battery Capacity: ' + car.runningCosts.batteryCapacity + ' kWh');
    console.log('Charging Time (0-100%): ' + car.runningCosts.chargingTime + ' hours');
    console.log('Home Charging Speed: ' + car.runningCosts.homeChargingSpeed + 'kW');
    console.log('Public Charging Speed: ' + car.runningCosts.publicChargingSpeed + 'kW');
    console.log('Rapid Charging Speed: ' + car.runningCosts.rapidChargingSpeed + 'kW');
    console.log('Charging Time (10-80%): ' + car.runningCosts.chargingTime10to80 + ' minutes');
    console.log('Electric Motor Power: ' + car.runningCosts.electricMotorPower + 'kW');
    console.log('Electric Motor Torque: ' + car.runningCosts.electricMotorTorque + 'Nm');
    console.log('Charging Port Type: ' + car.runningCosts.chargingPortType);
    console.log('Fast Charging: ' + car.runningCosts.fastChargingCapability);

    console.log('\n🎉 Running costs are now complete and comprehensive!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkGO14BLURunningCosts();