/**
 * Add running costs data to the existing bike
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function addBikeRunningCosts() {
  try {
    console.log('🏍️ Adding Running Costs to Bike');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bikeId = '6072560f-d343-4961-aace-7dad1e4d3ecd';
    
    // Find the bike
    const bike = await Bike.findOne({ advertId: bikeId });
    
    if (!bike) {
      console.log(`❌ Bike not found with advertId: ${bikeId}`);
      return;
    }
    
    console.log(`✅ Found Bike: ${bike.make} ${bike.model} (${bike.year})`);
    
    // Add running costs data for a Kawasaki Z650
    const runningCosts = {
      fuelEconomy: {
        urban: '45',
        extraUrban: '65', 
        combined: '55'
      },
      annualTax: '0', // Bikes typically have £0 road tax
      insuranceGroup: '8',
      co2Emissions: '95'
    };
    
    // Also add individual fields for compatibility
    bike.runningCosts = runningCosts;
    bike.urbanMpg = 45;
    bike.extraUrbanMpg = 65;
    bike.combinedMpg = 55;
    bike.annualTax = 0;
    bike.insuranceGroup = 8;
    bike.co2Emissions = 95;
    
    await bike.save();
    
    console.log('✅ Running costs added successfully:');
    console.log(`   Urban MPG: ${runningCosts.fuelEconomy.urban}`);
    console.log(`   Extra Urban MPG: ${runningCosts.fuelEconomy.extraUrban}`);
    console.log(`   Combined MPG: ${runningCosts.fuelEconomy.combined}`);
    console.log(`   Annual Tax: £${runningCosts.annualTax}`);
    console.log(`   Insurance Group: ${runningCosts.insuranceGroup}`);
    console.log(`   CO2 Emissions: ${runningCosts.co2Emissions}g/km`);
    
    console.log('\n🎯 Now the running costs section should be populated!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addBikeRunningCosts();