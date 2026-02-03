require('dotenv').config();
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function testCarFinderAPI() {
  try {
    console.log('🔍 Testing CarFinder API Response');
    console.log('='.repeat(50));
    
    const registration = 'EK11XHZ';
    const mileage = 85000;
    
    console.log(`Testing: ${registration} with ${mileage} miles`);
    
    // Call the same method that the API endpoint calls
    const result = await enhancedVehicleService.getVehicleDataWithFallback(registration, mileage);
    
    console.log('\n📊 API Response Structure:');
    console.log('Success:', result.success);
    console.log('Warnings:', result.warnings);
    
    if (result.success && result.data) {
      console.log('\n📋 Vehicle Data Fields:');
      console.log('Make:', result.data.make);
      console.log('Model:', result.data.model);
      console.log('Year:', result.data.year);
      console.log('Color:', result.data.color);
      console.log('FuelType:', result.data.fuelType);
      console.log('Transmission:', result.data.transmission);
      console.log('EngineSize:', result.data.engineSize);
      console.log('Doors:', result.data.doors);
      console.log('Variant:', result.data.variant);
      console.log('DataSources:', result.data.dataSources);
      
      console.log('\n🔍 Field Type Analysis:');
      Object.entries(result.data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          console.log(`${key}: OBJECT - ${JSON.stringify(value)}`);
        } else {
          console.log(`${key}: ${typeof value} - ${value}`);
        }
      });
      
      console.log('\n🎯 CarFinderFormPage Compatibility:');
      const hasWrappedObjects = Object.values(result.data).some(value => 
        typeof value === 'object' && value !== null && !Array.isArray(value) && value.hasOwnProperty('value')
      );
      
      if (hasWrappedObjects) {
        console.log('⚠️  WARNING: Response contains wrapped objects {value, source}');
        console.log('   This will cause React rendering errors in CarFinderFormPage');
        console.log('   Need to unwrap objects before sending to frontend');
      } else {
        console.log('✅ Response contains primitive values - compatible with React');
      }
      
    } else {
      console.log('\n❌ API call failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCarFinderAPI();