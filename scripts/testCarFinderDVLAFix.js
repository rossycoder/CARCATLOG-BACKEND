/**
 * Test script to verify CarFinder uses FREE DVLA API first
 * This should show £0.00 cost when DVLA API works
 */

require('dotenv').config();
const axios = require('axios');

async function testCarFinderDVLAFix() {
  try {
    console.log('🔍 Testing CarFinder DVLA Fix');
    console.log('=====================================');
    
    // Test registration - use a real UK registration
    const registration = 'AB12CDE'; // Example UK registration
    const mileage = 50000;
    
    // Test the basic lookup endpoint that CarFinderFormPage uses
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${baseURL}/api/vehicles/basic-lookup/${registration}?mileage=${mileage}`;
    
    console.log(`Calling API endpoint: ${url}`);
    console.log(`Expected: FREE DVLA API first (£0.00), fallback to CheckCarDetails (£0.05)`);
    console.log('');
    
    const response = await axios.get(url);
    
    if (response.data.success) {
      console.log('✅ API Response Success');
      console.log('=====================================');
      console.log(`From Cache: ${response.data.fromCache}`);
      console.log(`API Calls: ${response.data.apiCalls}`);
      console.log(`Cost: £${response.data.cost}`);
      console.log('');
      
      const vehicleData = response.data.data;
      console.log('Vehicle Data:');
      console.log(`  Registration: ${vehicleData.registration}`);
      console.log(`  Make: ${vehicleData.make}`);
      console.log(`  Model: ${vehicleData.model}`);
      console.log(`  Year: ${vehicleData.year}`);
      console.log(`  Color: ${vehicleData.color}`);
      console.log(`  Fuel Type: ${vehicleData.fuelType}`);
      console.log(`  Engine Size: ${vehicleData.engineSize}`);
      console.log(`  Body Type: ${vehicleData.bodyType}`);
      console.log(`  API Provider: ${vehicleData.apiProvider}`);
      console.log('');
      
      // Check if DVLA API was used (cost should be £0.00)
      if (response.data.cost === 0) {
        console.log('🎉 SUCCESS: FREE DVLA API was used (£0.00 cost)');
      } else if (response.data.cost === 0.05) {
        console.log('⚠️  FALLBACK: CheckCarDetails Vehiclespecs API was used (£0.05 cost)');
        console.log('   This means DVLA API failed, but fallback worked correctly');
      } else {
        console.log('❌ UNEXPECTED: Unknown API cost pattern');
      }
      
    } else {
      console.log('❌ API Response Failed');
      console.log('Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCarFinderDVLAFix();