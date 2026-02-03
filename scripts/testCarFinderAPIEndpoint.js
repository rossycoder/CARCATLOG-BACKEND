require('dotenv').config();
const axios = require('axios');

async function testCarFinderAPIEndpoint() {
  try {
    console.log('🔍 Testing CarFinder API Endpoint');
    console.log('='.repeat(50));
    
    const registration = 'EK11XHZ';
    const mileage = 85000;
    
    console.log(`Testing: ${registration} with ${mileage} miles`);
    
    // Test the actual API endpoint that CarFinderFormPage calls
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${baseURL}/api/vehicles/enhanced-lookup/${registration}?mileage=${mileage}`;
    
    console.log(`Calling API endpoint: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('\n📊 API Response Structure:');
    console.log('Success:', response.data.success);
    console.log('Warnings:', response.data.warnings);
    
    if (response.data.success && response.data.data) {
      console.log('\n📋 Vehicle Data Fields:');
      console.log('Make:', response.data.data.make);
      console.log('Model:', response.data.data.model);
      console.log('Year:', response.data.data.year);
      console.log('Color:', response.data.data.color);
      console.log('FuelType:', response.data.data.fuelType);
      console.log('Transmission:', response.data.data.transmission);
      console.log('EngineSize:', response.data.data.engineSize);
      console.log('Doors:', response.data.data.doors);
      console.log('Variant:', response.data.data.variant);
      console.log('DataSources:', response.data.dataSources);
      
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
        console.log('   The unwrapVehicleData method is not working correctly');
      } else {
        console.log('✅ Response contains primitive values - compatible with React');
        console.log('   The unwrapVehicleData method is working correctly');
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

testCarFinderAPIEndpoint();