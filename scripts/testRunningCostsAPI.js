require('dotenv').config();
const axios = require('axios');

async function testRunningCostsAPI() {
  try {
    console.log('🔍 Testing Running Costs API Data');
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
      
      console.log('\n🏃‍♂️ Running Costs Data:');
      console.log('Running Costs Object:', data.runningCosts);
      
      if (data.runningCosts) {
        console.log('\n📋 Fuel Economy:');
        console.log('Urban MPG:', data.runningCosts.fuelEconomy?.urban);
        console.log('Extra Urban MPG:', data.runningCosts.fuelEconomy?.extraUrban);
        console.log('Combined MPG:', data.runningCosts.fuelEconomy?.combined);
        
        console.log('\n💰 Costs:');
        console.log('Annual Tax:', data.runningCosts.annualTax);
        console.log('CO2 Emissions:', data.runningCosts.co2Emissions);
        console.log('Insurance Group:', data.runningCosts.insuranceGroup);
        
        console.log('\n🔍 Running Costs Analysis:');
        const missingRunningCosts = [];
        
        if (!data.runningCosts.fuelEconomy?.urban) missingRunningCosts.push('urban MPG');
        if (!data.runningCosts.fuelEconomy?.extraUrban) missingRunningCosts.push('extra urban MPG');
        if (!data.runningCosts.fuelEconomy?.combined) missingRunningCosts.push('combined MPG');
        if (!data.runningCosts.annualTax) missingRunningCosts.push('annual tax');
        if (!data.runningCosts.insuranceGroup) missingRunningCosts.push('insurance group');
        
        if (missingRunningCosts.length > 0) {
          console.log('❌ Missing running costs:', missingRunningCosts.join(', '));
        } else {
          console.log('✅ All running costs data present');
        }
      } else {
        console.log('❌ No running costs object found');
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

testRunningCostsAPI();