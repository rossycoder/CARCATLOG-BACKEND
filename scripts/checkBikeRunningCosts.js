/**
 * Check existing bike running costs and fix if needed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function checkBikeRunningCosts() {
  try {
    console.log('🏍️ Checking Bike Running Costs');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the existing bike
    const bike = await Bike.findOne({ advertId: '6072560f-d343-4961-aace-7dad1e4d3ecd' });
    
    if (!bike) {
      console.log('❌ No bike found');
      return;
    }
    
    console.log(`✅ Found Bike: ${bike.make} ${bike.model} (${bike.year})`);
    console.log(`   Registration: ${bike.registrationNumber || 'Not set'}`);
    console.log(`   Engine CC: ${bike.engineCC || 'Not set'}`);
    console.log(`   Price: £${bike.price || 'Not set'}`);
    
    console.log('\n💰 Current Running Costs:');
    if (bike.runningCosts) {
      console.log(`   Urban MPG: ${bike.runningCosts.urbanMpg || 'Not set'}`);
      console.log(`   Combined MPG: ${bike.runningCosts.combinedMpg || 'Not set'}`);
      console.log(`   Annual Tax: £${bike.runningCosts.annualTax || 'Not set'}`);
      console.log(`   Insurance Group: ${bike.runningCosts.insuranceGroup || 'Not set'}`);
    } else {
      console.log('   ❌ NO RUNNING COSTS DATA');
    }
    
    // Check individual fields
    console.log('\n🔧 Individual Running Cost Fields:');
    console.log(`   urbanMpg: ${bike.urbanMpg || 'Not set'}`);
    console.log(`   combinedMpg: ${bike.combinedMpg || 'Not set'}`);
    console.log(`   annualTax: ${bike.annualTax || 'Not set'}`);
    console.log(`   insuranceGroup: ${bike.insuranceGroup || 'Not set'}`);
    
    // Add sample running costs for bikes
    console.log('\n🔧 Adding Sample Running Costs for Bikes...');
    
    // Estimate running costs based on engine size
    const engineCC = bike.engineCC || 650;
    let estimatedMpg, estimatedTax, estimatedInsurance;
    
    if (engineCC <= 125) {
      estimatedMpg = 85;
      estimatedTax = 20;
      estimatedInsurance = 1;
    } else if (engineCC <= 250) {
      estimatedMpg = 75;
      estimatedTax = 20;
      estimatedInsurance = 2;
    } else if (engineCC <= 500) {
      estimatedMpg = 65;
      estimatedTax = 20;
      estimatedInsurance = 4;
    } else if (engineCC <= 750) {
      estimatedMpg = 55;
      estimatedTax = 20;
      estimatedInsurance = 6;
    } else {
      estimatedMpg = 45;
      estimatedTax = 20;
      estimatedInsurance = 8;
    }
    
    // Update bike with running costs
    bike.urbanMpg = estimatedMpg - 5;
    bike.combinedMpg = estimatedMpg;
    bike.annualTax = estimatedTax;
    bike.insuranceGroup = estimatedInsurance;
    
    // Also add to runningCosts object if it exists
    if (!bike.runningCosts) {
      bike.runningCosts = {};
    }
    bike.runningCosts.urbanMpg = estimatedMpg - 5;
    bike.runningCosts.combinedMpg = estimatedMpg;
    bike.runningCosts.annualTax = estimatedTax;
    bike.runningCosts.insuranceGroup = estimatedInsurance;
    
    await bike.save();
    
    console.log('✅ Updated Bike Running Costs:');
    console.log(`   Urban MPG: ${bike.urbanMpg}`);
    console.log(`   Combined MPG: ${bike.combinedMpg}`);
    console.log(`   Annual Tax: £${bike.annualTax}`);
    console.log(`   Insurance Group: ${bike.insuranceGroup}`);
    
    console.log('\n🎯 Solution for Missing Running Costs:');
    console.log('1. Bikes need running costs data populated');
    console.log('2. Frontend bike edit page should show these fields');
    console.log('3. API should return running costs for bikes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkBikeRunningCosts();