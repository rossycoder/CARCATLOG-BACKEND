require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testCheckCarDetailsForRunningCosts() {
  console.log('\n🔍 TESTING CheckCarDetails API FOR RUNNING COSTS');
  console.log('='.repeat(80));
  
  const apiKey = process.env.CHECKCARD_API_KEY;
  const registration = 'HUM777A';
  
  console.log(`API Key: ${apiKey ? '✅ Found' : '❌ Missing'}`);
  console.log(`Testing Registration: ${registration}`);
  console.log('='.repeat(80));
  
  // Test different endpoints
  const endpoints = [
    'vehicleregistration',
    'vehicledata',
    'history',
    'valuation',
    'specs'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing Endpoint: ${endpoint}`);
    console.log('-'.repeat(80));
    
    try {
      const response = await axios.get(
        `https://api.checkcardetails.co.uk/vehicledata/${endpoint}`,
        {
          params: {
            apikey: apiKey,
            vrm: registration
          }
        }
      );
      
      console.log(`✅ SUCCESS!`);
      console.log('Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Check for running costs fields
      console.log('\n🔍 Checking for Running Costs Fields:');
      const data = response.data;
      
      // Check all possible field names
      const fieldsToCheck = {
        'Fuel Economy Urban': ['fuelEconomyUrban', 'mpgUrban', 'urbanMpg', 'FuelConsumptionUrban'],
        'Fuel Economy Extra Urban': ['fuelEconomyExtraUrban', 'mpgExtraUrban', 'extraUrbanMpg', 'FuelConsumptionExtraUrban'],
        'Fuel Economy Combined': ['fuelEconomyCombined', 'mpgCombined', 'combinedMpg', 'FuelConsumptionCombined'],
        'Annual Tax': ['annualTax', 'vehicleTax', 'taxAmount', 'AnnualTax', 'VehicleTax'],
        'Insurance Group': ['insuranceGroup', 'InsuranceGroup'],
        'Previous Owners': ['previousOwners', 'numberOfOwners', 'PreviousOwners', 'NumberOfPreviousOwners']
      };
      
      for (const [label, possibleKeys] of Object.entries(fieldsToCheck)) {
        let found = false;
        for (const key of possibleKeys) {
          if (data[key] !== undefined && data[key] !== null) {
            console.log(`  ✅ ${label}: ${data[key]} (field: ${key})`);
            found = true;
            break;
          }
        }
        if (!found) {
          console.log(`  ❌ ${label}: Not found`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ERROR:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testCheckCarDetailsForRunningCosts();
