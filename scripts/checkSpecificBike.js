/**
 * Check specific bike data and running costs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function checkSpecificBike() {
  try {
    console.log('🏍️ Checking Specific Bike Data');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bikeId = '6072560f-d343-4961-aace-7dad1e4d3ecd';
    
    // Find bike by advertId (UUID)
    const bike = await Bike.findOne({ advertId: bikeId });
    
    if (!bike) {
      console.log(`❌ Bike not found with advertId: ${bikeId}`);
      
      // Try finding by _id
      const bikeById = await Bike.findById(bikeId);
      if (bikeById) {
        console.log(`✅ Found bike by _id instead`);
        console.log(`   Bike: ${bikeById.make} ${bikeById.model} (${bikeById.year})`);
        console.log(`   Registration: ${bikeById.registrationNumber || 'Not set'}`);
        console.log(`   Running Costs: ${JSON.stringify(bikeById.runningCosts || 'Not set', null, 2)}`);
      } else {
        console.log(`❌ Bike not found by _id either`);
      }
      return;
    }
    
    console.log(`✅ Found Bike:`);
    console.log(`   ID: ${bike._id}`);
    console.log(`   Advert ID: ${bike.advertId}`);
    console.log(`   Make/Model: ${bike.make} ${bike.model} (${bike.year})`);
    console.log(`   Registration: ${bike.registrationNumber || 'Not set'}`);
    console.log(`   Engine CC: ${bike.engineCC || 'Not set'}`);
    console.log(`   Bike Type: ${bike.bikeType || 'Not set'}`);
    console.log(`   Price: £${bike.price || 'Not set'}`);
    
    console.log('\n💰 Running Costs Analysis:');
    if (bike.runningCosts) {
      console.log(`   Urban MPG: ${bike.runningCosts.urbanMpg || 'Not set'}`);
      console.log(`   Extra Urban MPG: ${bike.runningCosts.extraUrbanMpg || 'Not set'}`);
      console.log(`   Combined MPG: ${bike.runningCosts.combinedMpg || 'Not set'}`);
      console.log(`   Annual Tax: £${bike.runningCosts.annualTax || 'Not set'}`);
      console.log(`   Insurance Group: ${bike.runningCosts.insuranceGroup || 'Not set'}`);
    } else {
      console.log(`   ❌ NO RUNNING COSTS DATA FOUND`);
      console.log(`   This is why running costs are not showing on edit page`);
    }
    
    console.log('\n🔧 Bike Schema Fields:');
    const bikeObj = bike.toObject();
    Object.keys(bikeObj).forEach(key => {
      if (key.includes('mpg') || key.includes('tax') || key.includes('insurance') || key.includes('running')) {
        console.log(`   ${key}: ${bikeObj[key]}`);
      }
    });
    
    // Check if bike has vehicle history data
    if (bike.historyCheckId) {
      console.log(`\n📊 Vehicle History ID: ${bike.historyCheckId}`);
      const VehicleHistory = require('../models/VehicleHistory');
      const history = await VehicleHistory.findById(bike.historyCheckId);
      if (history) {
        console.log(`   History Data Available: Yes`);
        console.log(`   Urban MPG: ${history.urbanMpg || 'Not set'}`);
        console.log(`   Combined MPG: ${history.combinedMpg || 'Not set'}`);
        console.log(`   Annual Tax: £${history.annualTax || 'Not set'}`);
        console.log(`   Insurance Group: ${history.insuranceGroup || 'Not set'}`);
      } else {
        console.log(`   ❌ History data not found`);
      }
    } else {
      console.log(`\n❌ No vehicle history linked to this bike`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkSpecificBike();