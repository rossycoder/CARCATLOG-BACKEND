require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarDataStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find a car with registration EK11XHZ
    const car = await Car.findOne({ registrationNumber: 'EK11XHZ' })
      .populate('historyCheckId');
    
    if (!car) {
      console.log('❌ No car found with registration EK11XHZ');
      return;
    }
    
    console.log('\n🚗 Car Data Structure:');
    console.log('Car ID:', car._id);
    console.log('Registration:', car.registrationNumber);
    console.log('Make/Model:', car.make, car.model);
    console.log('Price:', car.price);
    console.log('Estimated Value:', car.estimatedValue);
    
    console.log('\n💰 Valuation Data:');
    console.log('Valuation Object:', car.valuation);
    console.log('All Valuations:', car.allValuations);
    
    console.log('\n🏃‍♂️ Running Costs in Car:');
    console.log('Running Costs Object:', car.runningCosts);
    console.log('Individual Fields:');
    console.log('  Urban MPG:', car.fuelEconomyUrban);
    console.log('  Extra Urban MPG:', car.fuelEconomyExtraUrban);
    console.log('  Combined MPG:', car.fuelEconomyCombined);
    console.log('  Annual Tax:', car.annualTax);
    console.log('  CO2 Emissions:', car.co2Emissions);
    console.log('  Insurance Group:', car.insuranceGroup);
    
    console.log('\n🔗 History Check Link:');
    console.log('History Check ID:', car.historyCheckId?._id);
    console.log('History Check Status:', car.historyCheckStatus);
    
    if (car.historyCheckId) {
      console.log('\n📊 VehicleHistory Data:');
      console.log('Urban MPG:', car.historyCheckId.urbanMpg);
      console.log('Extra Urban MPG:', car.historyCheckId.extraUrbanMpg);
      console.log('Combined MPG:', car.historyCheckId.combinedMpg);
      console.log('Annual Tax:', car.historyCheckId.annualTax);
      console.log('CO2 Emissions:', car.historyCheckId.co2Emissions);
      console.log('Insurance Group:', car.historyCheckId.insuranceGroup);
      console.log('Write-off Category:', car.historyCheckId.writeOffCategory);
      console.log('Previous Owners:', car.historyCheckId.numberOfPreviousKeepers);
    } else {
      console.log('❌ No VehicleHistory linked to this car');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCarDataStructure();