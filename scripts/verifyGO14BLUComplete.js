const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function verifyGO14BLUComplete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    const carId = '69879bb9d4a7f60f5dfb4083';
    const car = await Car.findById(carId).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('=== COMPLETE CAR DATA VERIFICATION ===\n');

    console.log('🚗 BASIC INFORMATION:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model} ${car.variant}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Color: ${car.color}`);
    console.log(`   Fuel Type: ${car.fuelType}`);
    console.log(`   Body Type: ${car.bodyType}`);
    console.log(`   Doors/Seats: ${car.doors}dr / ${car.seats} seats`);
    console.log(`   Transmission: ${car.transmission}`);
    console.log(`   Mileage: ${car.mileage?.toLocaleString()} miles`);

    console.log('\n⚡ ELECTRIC VEHICLE DATA:');
    console.log(`   Electric Range: ${car.electricRange} miles`);
    console.log(`   Battery Capacity: ${car.batteryCapacity} kWh`);
    console.log(`   Charging Time (0-100%): ${car.chargingTime} hours`);
    console.log(`   CO2 Emissions: ${car.co2Emissions}g/km`);

    console.log('\n🏁 PERFORMANCE DATA:');
    console.log(`   Power: ${car.power} BHP`);
    console.log(`   Torque: ${car.torque} Nm`);
    console.log(`   0-60 mph: ${car.acceleration} seconds`);
    console.log(`   Top Speed: ${car.topSpeed} mph`);

    console.log('\n💰 FINANCIAL DATA:');
    console.log(`   Price: £${car.price?.toLocaleString()}`);
    console.log(`   Estimated Value: £${car.estimatedValue?.toLocaleString()}`);
    console.log(`   Annual Tax: £${car.annualTax}`);

    console.log('\n🔧 RUNNING COSTS:');
    if (car.runningCosts) {
      console.log(`   ✅ Running costs object exists`);
      console.log(`   Annual Tax: £${car.runningCosts.annualTax}`);
      console.log(`   CO2 Emissions: ${car.runningCosts.co2Emissions}g/km`);
      console.log(`   Electric Range: ${car.runningCosts.electricRange} miles`);
      console.log(`   Battery Capacity: ${car.runningCosts.batteryCapacity} kWh`);
      console.log(`   Home Charging: ${car.runningCosts.homeChargingSpeed}kW`);
      console.log(`   Rapid Charging: ${car.runningCosts.rapidChargingSpeed}kW`);
      console.log(`   Motor Power: ${car.runningCosts.electricMotorPower}kW`);
      console.log(`   Motor Torque: ${car.runningCosts.electricMotorTorque}Nm`);
      console.log(`   Charging Ports: ${car.runningCosts.chargingPortType}`);
    } else {
      console.log(`   ❌ Running costs missing`);
    }

    console.log('\n🔍 MOT DATA:');
    console.log(`   MOT Status: ${car.motStatus}`);
    console.log(`   MOT Due: ${car.motDue ? car.motDue.toLocaleDateString('en-GB') : 'N/A'}`);
    console.log(`   MOT History: ${car.motHistory ? car.motHistory.length : 0} tests`);

    console.log('\n📋 VEHICLE HISTORY:');
    if (car.historyCheckId) {
      console.log(`   ✅ Vehicle history linked`);
      console.log(`   Previous Owners: ${car.historyCheckId.numberOfPreviousKeepers}`);
      console.log(`   Write Off Category: ${car.historyCheckId.writeOffCategory}`);
      console.log(`   Exported: ${car.historyCheckId.exported}`);
      console.log(`   Scrapped: ${car.historyCheckId.scrapped}`);
    } else {
      console.log(`   ❌ Vehicle history not linked`);
    }

    console.log('\n=== DATA COMPLETENESS CHECK ===');
    
    const requiredFields = [
      { name: 'Registration', value: car.registrationNumber },
      { name: 'Make', value: car.make },
      { name: 'Model', value: car.model },
      { name: 'Year', value: car.year },
      { name: 'Color', value: car.color },
      { name: 'Fuel Type', value: car.fuelType },
      { name: 'Body Type', value: car.bodyType },
      { name: 'Doors', value: car.doors },
      { name: 'Seats', value: car.seats },
      { name: 'Electric Range', value: car.electricRange },
      { name: 'Battery Capacity', value: car.batteryCapacity },
      { name: 'Annual Tax', value: car.annualTax },
      { name: 'Estimated Value', value: car.estimatedValue },
      { name: 'MOT Status', value: car.motStatus },
      { name: 'MOT Due', value: car.motDue },
      { name: 'Running Costs', value: car.runningCosts }
    ];

    let complete = 0;
    let missing = 0;

    requiredFields.forEach(field => {
      if (field.value !== null && field.value !== undefined && field.value !== '') {
        console.log(`   ✅ ${field.name}: Present`);
        complete++;
      } else {
        console.log(`   ❌ ${field.name}: Missing`);
        missing++;
      }
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Complete fields: ${complete}/${requiredFields.length}`);
    console.log(`Missing fields: ${missing}/${requiredFields.length}`);
    console.log(`Completion rate: ${Math.round((complete / requiredFields.length) * 100)}%`);

    if (missing === 0) {
      console.log('\n🎉 CAR DATA IS 100% COMPLETE!');
    } else {
      console.log(`\n⚠️  Car data is ${Math.round((complete / requiredFields.length) * 100)}% complete`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

verifyGO14BLUComplete();