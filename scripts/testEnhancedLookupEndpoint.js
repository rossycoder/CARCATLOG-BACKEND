const axios = require('axios');

async function testEnhancedLookupEndpoint() {
  try {
    console.log('🔍 Testing Enhanced Lookup Endpoint');
    console.log('='.repeat(50));
    
    const registration = 'EK11XHZ';
    const mileage = 2500;
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${baseURL}/api/vehicles/enhanced-lookup/${registration}?mileage=${mileage}`;
    
    console.log(`Calling: ${url}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log('\n📊 Response Structure:');
    console.log(`Success: ${data.success}`);
    console.log(`Warnings: ${JSON.stringify(data.warnings)}`);
    console.log(`Data Sources: ${JSON.stringify(data.dataSources)}`);
    
    if (data.data.valuation) {
      console.log('\n💰 Valuation Data Found:');
      console.log(`VRM: ${data.data.valuation.vrm}`);
      console.log(`Mileage: ${data.data.valuation.mileage}`);
      console.log('Full valuation object:', JSON.stringify(data.data.valuation, null, 2));
      console.log(`Private: £${data.data.valuation.estimatedValue?.private}`);
      console.log(`Retail: £${data.data.valuation.estimatedValue?.retail}`);
      console.log(`Trade: £${data.data.valuation.estimatedValue?.trade}`);
      console.log(`Confidence: ${data.data.valuation.confidence}`);
    } else {
      console.log('\n❌ No valuation data in response');
    }
    
    console.log('\n🏃 Running Costs:');
    if (data.data.runningCosts) {
      console.log(`Urban MPG: ${data.data.runningCosts.fuelEconomy?.urban}`);
      console.log(`Combined MPG: ${data.data.runningCosts.fuelEconomy?.combined}`);
      console.log(`Annual Tax: £${data.data.runningCosts.annualTax}`);
      console.log(`CO2: ${data.data.runningCosts.co2Emissions}g/km`);
    } else {
      console.log('No running costs data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEnhancedLookupEndpoint();