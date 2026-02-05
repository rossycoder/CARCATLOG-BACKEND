#!/usr/bin/env node

/**
 * Test BG22UCP API Endpoint Response
 * 
 * This script tests the actual API endpoint to see vehicle history data
 */

const mongoose = require('mongoose');
const express = require('express');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function testAPIEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    // Simulate the API call that frontend makes
    console.log('🌐 Testing API endpoint: GET /api/vehicles/:id');
    
    // Find car by advertId (this is what frontend uses)
    const advertId = 'f5f89e0b-5276-4172-9754-64477da3e9b7';
    console.log(`   Looking for car with advertId: ${advertId}`);
    
    const car = await Car.findOne({ advertId: advertId }).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found by advertId');
      return;
    }

    console.log('✅ Car found via API lookup');
    console.log('   Registration:', car.registrationNumber);
    console.log('   Make/Model:', car.make, car.model);
    
    // Convert to plain object (like API does)
    const carData = car.toObject();
    
    console.log('\n📋 Vehicle History Data in API Response:');
    if (carData.historyCheckId) {
      console.log('   ✅ History data is populated');
      console.log('   Previous Owners:', carData.historyCheckId.previousOwners);
      console.log('   Keys:', carData.historyCheckId.keys);
      console.log('   Write-off Category:', carData.historyCheckId.writeOffCategory);
      console.log('   Is Written Off:', carData.historyCheckId.isWrittenOff);
      console.log('   Has Accident History:', carData.historyCheckId.hasAccidentHistory);
      console.log('   Is Stolen:', carData.historyCheckId.isStolen);
      console.log('   Outstanding Finance:', carData.historyCheckId.hasOutstandingFinance);
      console.log('   Is Scrapped:', carData.historyCheckId.isScrapped);
      console.log('   Is Imported:', carData.historyCheckId.isImported);
      console.log('   Is Exported:', carData.historyCheckId.isExported);
      
      // Check the structure that frontend expects
      console.log('\n🎯 Frontend Expected Structure:');
      console.log('   carData.historyCheckId exists:', !!carData.historyCheckId);
      console.log('   carData.historyCheckId.previousOwners:', carData.historyCheckId.previousOwners);
      console.log('   carData.historyCheckId.writeOffCategory:', carData.historyCheckId.writeOffCategory);
      
      // Simulate what VehicleHistorySection component would receive
      const historyData = carData.historyCheckId;
      console.log('\n🔍 VehicleHistorySection Component Data:');
      console.log('   Previous Owners:', historyData.previousOwners || 'Unknown');
      console.log('   Keys:', historyData.keys || 'Unknown');
      console.log('   Write-off Status:', historyData.writeOffCategory === 'none' ? 'Clean' : historyData.writeOffCategory);
      console.log('   Stolen Status:', historyData.isStolen ? 'Stolen' : 'Not stolen');
      console.log('   Finance Status:', historyData.hasOutstandingFinance ? 'Outstanding finance' : 'No outstanding finance');
      
    } else {
      console.log('   ❌ No history data populated');
    }

    // Test the exact API response structure
    console.log('\n📡 Complete API Response Structure:');
    const apiResponse = {
      success: true,
      data: carData
    };
    
    console.log('   Response has historyCheckId:', !!apiResponse.data.historyCheckId);
    console.log('   Response historyCheckId type:', typeof apiResponse.data.historyCheckId);
    
    if (apiResponse.data.historyCheckId) {
      console.log('   ✅ Vehicle history will display correctly in frontend');
    } else {
      console.log('   ❌ Vehicle history will NOT display in frontend');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run the test
testAPIEndpoint();