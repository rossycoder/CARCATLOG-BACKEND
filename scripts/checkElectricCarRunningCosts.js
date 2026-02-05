const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function checkElectricCarRunningCosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the electric BMW car
    const electricCar = await Car.findOne({ 
      registrationNumber: 'BG22UCP' 
    }).populate('historyCheckId');

    if (!electricCar) {
      console.log('❌ Electric car BG22UCP not found');
      return;
    }

    console.log('🔋 Electric Car Analysis: BG22UCP');
    console.log('=====================================');
    
    console.log('\n1. BASIC INFO:');
    console.log(`   Make/Model: ${electricCar.make} ${electricCar.model}`);
    console.log(`   Year: ${electricCar.year}`);
    console.log(`   Fuel Type: ${electricCar.fuelType}`);
    console.log(`   Status: ${electricCar.advertStatus}`);
    
    console.log('\n2. RUNNING COSTS OBJECT:');
    console.log(`   runningCosts exists: ${!!electricCar.runningCosts}`);
    if (electricCar.runningCosts) {
      console.log(`   runningCosts type: ${typeof electricCar.runningCosts}`);
      console.log(`   runningCosts content:`, JSON.stringify(electricCar.runningCosts, null, 2));
      
      console.log('\n3. INDIVIDUAL RUNNING COSTS:');
      console.log(`   Annual Tax: ${electricCar.runningCosts.annualTax || 'N/A'}`);
      console.log(`   Insurance Group: ${electricCar.runningCosts.insuranceGroup || 'N/A'}`);
      console.log(`   CO2 Emissions: ${electricCar.runningCosts.co2Emissions || 'N/A'}`);
      console.log(`   Combined MPG: ${electricCar.runningCosts.fuelEconomy?.combined || 'N/A'}`);
      console.log(`   Urban MPG: ${electricCar.runningCosts.fuelEconomy?.urban || 'N/A'}`);
      console.log(`   Extra Urban MPG: ${electricCar.runningCosts.fuelEconomy?.extraUrban || 'N/A'}`);
    }
    
    console.log('\n4. FRONTEND DISPLAY LOGIC TEST:');
    const hasRunningCosts = electricCar.runningCosts && (
      electricCar.runningCosts.fuelEconomy?.combined || 
      electricCar.runningCosts.co2Emissions || 
      electricCar.runningCosts.insuranceGroup || 
      electricCar.runningCosts.annualTax
    );
    console.log(`   Should show running costs section: ${hasRunningCosts}`);
    
    if (hasRunningCosts) {
      console.log('\n   ✅ ITEMS THAT WILL SHOW:');
      if (electricCar.runningCosts.fuelEconomy?.combined) {
        console.log(`      - Combined MPG: ${electricCar.runningCosts.fuelEconomy.combined} mpg`);
      }
      if (electricCar.runningCosts.fuelEconomy?.urban) {
        console.log(`      - Urban MPG: ${electricCar.runningCosts.fuelEconomy.urban} mpg`);
      }
      if (electricCar.runningCosts.fuelEconomy?.extraUrban) {
        console.log(`      - Extra Urban MPG: ${electricCar.runningCosts.fuelEconomy.extraUrban} mpg`);
      }
      if (electricCar.runningCosts.co2Emissions) {
        console.log(`      - CO2 Emissions: ${electricCar.runningCosts.co2Emissions}g/km`);
      }
      if (electricCar.runningCosts.insuranceGroup) {
        console.log(`      - Insurance Group: ${electricCar.runningCosts.insuranceGroup}`);
      }
      if (electricCar.runningCosts.annualTax) {
        console.log(`      - Annual Tax: £${electricCar.runningCosts.annualTax}`);
      }
    } else {
      console.log('\n   ❌ NO RUNNING COSTS WILL SHOW');
      console.log('   Reasons:');
      console.log(`      - runningCosts object exists: ${!!electricCar.runningCosts}`);
      if (electricCar.runningCosts) {
        console.log(`      - Has combined MPG: ${!!electricCar.runningCosts.fuelEconomy?.combined}`);
        console.log(`      - Has CO2 emissions: ${!!electricCar.runningCosts.co2Emissions}`);
        console.log(`      - Has insurance group: ${!!electricCar.runningCosts.insuranceGroup}`);
        console.log(`      - Has annual tax: ${!!electricCar.runningCosts.annualTax}`);
      }
    }
    
    console.log('\n5. ELECTRIC CAR SPECIFIC INFO:');
    console.log('   For electric cars, we should show:');
    console.log('   - Annual Tax (road tax)');
    console.log('   - Insurance Group');
    console.log('   - CO2 Emissions (usually 0 for pure electric)');
    console.log('   - Energy efficiency (kWh/100km) instead of MPG');
    
    console.log('\n✅ Electric car running costs check completed!');

  } catch (error) {
    console.error('❌ Error checking electric car running costs:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkElectricCarRunningCosts();