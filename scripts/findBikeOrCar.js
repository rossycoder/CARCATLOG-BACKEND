/**
 * Find bike or car by advertId
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const Car = require('../models/Car');

async function findBikeOrCar() {
  try {
    console.log('🔍 Searching for Vehicle by Advert ID');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const advertId = '38a5a5c5-366b-4578-bbd9-88d08ad87cd4';
    
    // Check if it's a bike
    console.log('\n🏍️ Checking Bikes...');
    const bike = await Bike.findOne({ advertId: advertId });
    if (bike) {
      console.log(`✅ FOUND BIKE:`);
      console.log(`   Make/Model: ${bike.make} ${bike.model} (${bike.year})`);
      console.log(`   Registration: ${bike.registrationNumber || 'Not set'}`);
      console.log(`   Running Costs: ${bike.runningCosts ? 'Available' : 'NOT AVAILABLE'}`);
      return;
    } else {
      console.log(`❌ No bike found with advertId: ${advertId}`);
    }
    
    // Check if it's a car
    console.log('\n🚗 Checking Cars...');
    const car = await Car.findOne({ advertId: advertId });
    if (car) {
      console.log(`✅ FOUND CAR (not bike):`);
      console.log(`   Make/Model: ${car.make} ${car.model} (${car.year})`);
      console.log(`   Registration: ${car.registrationNumber || 'Not set'}`);
      console.log(`   Running Costs: ${car.runningCosts ? 'Available' : 'NOT AVAILABLE'}`);
      console.log(`   Urban MPG: ${car.urbanMpg || 'Not set'}`);
      console.log(`   Combined MPG: ${car.combinedMpg || 'Not set'}`);
      console.log(`   Annual Tax: £${car.annualTax || 'Not set'}`);
      console.log(`   Insurance Group: ${car.insuranceGroup || 'Not set'}`);
      
      console.log('\n⚠️ ISSUE IDENTIFIED:');
      console.log('   This is a CAR, not a BIKE!');
      console.log('   The URL /bikes/selling/advert/edit/ is wrong for a car.');
      console.log('   Should be: /cars/selling/advert/edit/ or /selling/advert/edit/');
      return;
    } else {
      console.log(`❌ No car found with advertId: ${advertId}`);
    }
    
    // List some recent bikes and cars
    console.log('\n📋 Recent Bikes in Database:');
    const recentBikes = await Bike.find({}).sort({ createdAt: -1 }).limit(5);
    recentBikes.forEach((bike, index) => {
      console.log(`   ${index + 1}. ${bike.make} ${bike.model} - ID: ${bike.advertId || bike._id}`);
    });
    
    console.log('\n📋 Recent Cars in Database:');
    const recentCars = await Car.find({}).sort({ createdAt: -1 }).limit(5);
    recentCars.forEach((car, index) => {
      console.log(`   ${index + 1}. ${car.make} ${car.model} - ID: ${car.advertId || car._id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

findBikeOrCar();