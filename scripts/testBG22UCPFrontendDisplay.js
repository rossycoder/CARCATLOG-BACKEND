#!/usr/bin/env node

/**
 * Test BG22UCP Frontend Display Logic
 * 
 * This script tests the exact logic used in the frontend component
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function testFrontendDisplayLogic() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    // Get the car data exactly as the API would serve it
    const car = await Car.findOne({ advertId: 'f5f89e0b-5276-4172-9754-64477da3e9b7' }).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    const carData = car.toObject();
    const historyData = carData.historyCheckId;
    
    console.log('🚗 Car Data:');
    console.log('   Registration:', carData.registrationNumber);
    console.log('   History Check ID:', carData.historyCheckId?._id);
    
    console.log('\n📋 Raw History Data:');
    console.log('   previousOwners:', historyData.previousOwners, '(type:', typeof historyData.previousOwners, ')');
    console.log('   numberOfPreviousKeepers:', historyData.numberOfPreviousKeepers, '(type:', typeof historyData.numberOfPreviousKeepers, ')');
    console.log('   keys:', historyData.keys, '(type:', typeof historyData.keys, ')');
    console.log('   