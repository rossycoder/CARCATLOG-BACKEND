require('dotenv').config();
const axios = require('axios');

async function testBasicLookupFresh() {
  try {
    console.log('🔍 Testing Basic Lookup API with Fresh Registration');
    console.log('='.repeat(60));
    
    // Use a different registration to force fresh API call
    const registration = 'AB12CDE'; // This should not be in cache
    const mileage = 50000;
    
    console.log(`Testing: ${registration} with ${mileage} miles (should force fresh API call)`);
    
    // Test the basic lookup endpoint
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${baseURL}/api/vehicles/basic-lookup/${registration}?mileage=${mileage}`;
    
    console.log(`Calling API endpoint: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('\n📊 API Response Structure:');
    console.log('Success:', response.data.success);
    console.log('From Cache:', response.data.fromCache);
    console.log('API Calls:', response.data.apiCalls);
    console.log('Cost: £' + response.data.cost);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      
      console.log('\n📋 Vehicle Data Fields:');
      console.log('Make:', data.make);
      console.log('Model:', data.model);
      console.log('Variant:', data.variant);
      console.log('Year:', data.year);
      console.log('Color:', data.color);
      console.log('FuelType:', data.fuelType);
      console.log('Transmission:', data.transmission);
      console.log('EngineSize:', data.engineSize);
      console.log('BodyType:', data.bodyType);
      console.log('Doors:', data.doors);
      console.log('Seats:', data.seats);
      console.log('Gearbox:', data.gearbox);
      console.log('EmissionClass:', data.emissionClass);
      console.log('CO2Emissions:', data.co2Emissions);
      
      console.log('\n🔍 Fresh API Call Analysis:');
      if (response.data.fromCache) {
        console.log('⚠️  Data came from cache - try different registration');
      } else {
        console.log('✅ Fresh API call made - testing Vehiclespecs API');
        console.log(`   Cost: £${response.data.cost} (should be £0.05 for Vehiclespecs)`);
        
        const missingFields = [];
        if (!data.variant) missingFields.push('variant');
        if (!data.doors) missingFields.push('doors');
        if (!data.seats) missingFields.push('seats');
        if (!data.gearbox) missingFields.push('gearbox');
        if (!data.emissionClass) missingFields.push('emissionClass');
        
        if (missingFields.length > 0) {
          console.log('❌ Missing fields from Vehiclespecs API:', missingFields.join(', '));
          console.log('   This is expected - Vehiclespecs may not have all fields');
        } else {
          console.log('✅ All fields present from Vehiclespecs API');
        }
      }
      
    } else {
      console.log('\n❌ API call failed:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBasicLookupFresh();