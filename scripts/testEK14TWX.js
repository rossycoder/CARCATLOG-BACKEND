/**
 * Test EK14TWX registration number
 * Debug why data is showing "Please verify"
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEK14TWX() {
  const registration = 'EK14TWX';
  
  console.log('='.repeat(80));
  console.log(`Testing Registration: ${registration}`);
  console.log('='.repeat(80));
  
  // Test 1: DVLA API (if you have it)
  console.log('\n📊 TEST 1: DVLA API');
  console.log('-'.repeat(80));
  try {
    // Check if DVLA service exists
    const dvlaService = require('../services/dvlaService');
    const dvlaData = await dvlaService.getVehicleData(registration);
    console.log('✅ DVLA Data:');
    console.log(JSON.stringify(dvlaData, null, 2));
  } catch (error) {
    console.log('❌ DVLA Error:', error.message);
  }
  
  // Test 2: CheckCarDetails API
  console.log('\n📊 TEST 2: CheckCarDetails API');
  console.log('-'.repeat(80));
  try {
    const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
    const checkCarData = await CheckCarDetailsClient.getVehicleData(registration);
    console.log('✅ CheckCarDetails Data:');
    console.log(JSON.stringify(checkCarData, null, 2));
  } catch (error) {
    console.log('❌ CheckCarDetails Error:', error.message);
    console.log('   Code:', error.code);
  }
  
  // Test 3: Enhanced Vehicle Service (combines both)
  console.log('\n📊 TEST 3: Enhanced Vehicle Service');
  console.log('-'.repeat(80));
  try {
    const enhancedVehicleService = require('../services/enhancedVehicleService');
    const enhancedData = await enhancedVehicleService.getVehicleData(registration);
    console.log('✅ Enhanced Data:');
    console.log(JSON.stringify(enhancedData, null, 2));
  } catch (error) {
    console.log('❌ Enhanced Service Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS');
  console.log('='.repeat(80));
  console.log('\nIf you see "Please verify" in the frontend, it means:');
  console.log('1. API returned null/undefined for that field');
  console.log('2. Frontend is showing fallback message');
  console.log('3. Need to check which API is being called');
  console.log('='.repeat(80));
}

testEK14TWX().catch(console.error);
