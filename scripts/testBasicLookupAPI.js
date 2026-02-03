require('dotenv').config();
const axios = require('axios');

async function testBasicLookupAPI() {
  try {
    console.log('🔍 Testing Basic Lookup API Endpoint');
    console.log('='.repeat(50));
    
    const registration = 'EK11XHZ';
    const mileage = 2500;
    
    console.log(`Testing: ${registration} with ${mileage} miles`);
    
    // Test the basic lookup endpoint that CarFinderFormPage will use
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
      console.log('\n📋 Vehicle Data Fields:');
      console.log('Make:', response.data.data.make);
      console.log('Model:', response.data.data.model);
      console.log('Variant:', response.data.data.variant);
      console.log('Year:', response.data.data.year);
      console.log('Color:', response.data.data.color);
      console.log('FuelType:', response.data.data.fuelType);
      console.log('Transmission:', response.data.data.transmission);
      console.log('EngineSize:', response.data.data.engineSize);
      console.log('BodyType:', response.data.data.bodyType);
      console.log('Doors:', response.data.data.doors);
      console.log('Seats:', response.data.data.seats);
      
      console.log('\n🔍 Field Type Analysis:');
      Object.entries(response.data.data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          console.log(`${key}: OBJECT - ${JSON.stringify(value)}`);
        } else {
          console.log(`${key}: ${typeof value} - ${value}`);
        }
      });
      
      console.log('\n🎯 CarFinderFormPage Compatibility:');
      const hasWrappedObjects = Object.values(response.data.data).some(value => 
        typeof value === 'object' && value !== null && !Array.isArray(value) && value.hasOwnProperty('value')
      );
      
      if (hasWrappedObjects) {
        console.log('⚠️  WARNING: Response contains wrapped objects {value, source}');
        console.log('   This will cause React rendering errors in CarFinderFormPage');
      } else {
        console.log('✅ Response contains primitive values - compatible with React');
        console.log('   Basic lookup is working correctly for CarFinder');
      }
      
      console.log('\n💰 Cost Analysis:');
      if (response.data.fromCache) {
        console.log('✅ Data served from cache - £0.00 cost');
      } else {
        console.log(`💸 Fresh API call - £${response.data.cost} cost`);
        console.log('   This is much cheaper than enhanced lookup (£1.96)');
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

testBasicLookupAPI();