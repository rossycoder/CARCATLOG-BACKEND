require('dotenv').config();
const axios = require('axios');

async function testEnhancedDataFields() {
  try {
    console.log('🔍 Testing Enhanced Data Fields for CarFinder');
    console.log('='.repeat(60));
    
    const registration = 'EK11XHZ';
    const mileage = 2500;
    
    console.log(`Testing: ${registration} with ${mileage} miles`);
    
    // Test the enhanced lookup endpoint
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${baseURL}/api/vehicles/enhanced-lookup/${registration}?mileage=${mileage}`;
    
    console.log(`Calling API endpoint: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('\n📊 API Response Structure:');
    console.log('Success:', response.data.success);
    console.log('Warnings:', response.data.warnings);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      
      console.log('\n📋 Key Vehicle Data Fields:');
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
      console.log('PreviousOwners:', data.previousOwners);
      console.log('NumberOfPreviousKeepers:', data.numberOfPreviousKeepers);
      console.log('Gearbox:', data.gearbox);
      console.log('EmissionClass:', data.emissionClass);
      console.log('CO2Emissions:', data.co2Emissions);
      
      console.log('\n🔍 Missing Fields Analysis:');
      const missingFields = [];
      
      if (!data.bodyType) missingFields.push('bodyType');
      if (!data.previousOwners && !data.numberOfPreviousKeepers) missingFields.push('previousOwners');
      if (!data.gearbox) missingFields.push('gearbox');
      if (!data.emissionClass) missingFields.push('emissionClass');
      if (!data.doors) missingFields.push('doors');
      if (!data.seats) missingFields.push('seats');
      if (!data.variant) missingFields.push('variant');
      
      if (missingFields.length > 0) {
        console.log('❌ Missing fields:', missingFields.join(', '));
      } else {
        console.log('✅ All expected fields are present');
      }
      
      console.log('\n🎯 Field Values Check:');
      console.log('EngineSize type:', typeof data.engineSize, 'value:', data.engineSize);
      console.log('PreviousOwners type:', typeof data.previousOwners, 'value:', data.previousOwners);
      console.log('NumberOfPreviousKeepers type:', typeof data.numberOfPreviousKeepers, 'value:', data.numberOfPreviousKeepers);
      console.log('BodyType type:', typeof data.bodyType, 'value:', data.bodyType);
      console.log('Gearbox type:', typeof data.gearbox, 'value:', data.gearbox);
      console.log('EmissionClass type:', typeof data.emissionClass, 'value:', data.emissionClass);
      
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

testEnhancedDataFields();