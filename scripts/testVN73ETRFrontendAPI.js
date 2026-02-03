require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testVN73ETRFrontendAPI() {
  try {
    console.log('🔍 TESTING VN73ETR FRONTEND API CALL');
    console.log('===================================');
    
    const carId = '6981fce2e32b03391ffd264b';
    const baseUrl = 'http://localhost:5000';
    
    console.log(`📡 Calling: ${baseUrl}/api/vehicles/${carId}`);
    
    const response = await axios.get(`${baseUrl}/api/vehicles/${carId}`);
    
    if (response.data.success) {
      const car = response.data.data;
      
      console.log('\n📊 API RESPONSE DATA:');
      console.log('====================');
      console.log('Car ID:', car._id);
      console.log('Registration:', car.registrationNumber);
      console.log('Make/Model:', car.make, car.model);
      
      console.log('\n🏃 RUNNING COSTS FROM API:');
      console.log('==========================');
      console.log('Full runningCosts object:', JSON.stringify(car.runningCosts, null, 2));
      
      if (car.runningCosts) {
        console.log('\n🔍 INDIVIDUAL FIELDS:');
        console.log('Urban MPG:', car.runningCosts.fuelEconomy?.urban);
        console.log('Extra Urban MPG:', car.runningCosts.fuelEconomy?.extraUrban);
        console.log('Combined MPG:', car.runningCosts.fuelEconomy?.combined);
        console.log('Annual Tax:', car.runningCosts.annualTax);
        console.log('CO2 Emissions:', car.runningCosts.co2Emissions);
        console.log('Insurance Group:', car.runningCosts.insuranceGroup);
      }
      
      console.log('\n🔧 MOT DATA FROM API:');
      console.log('=====================');
      console.log('MOT Status:', car.motStatus);
      console.log('MOT Due:', car.motDue);
      console.log('MOT Expiry:', car.motExpiry);
      
      console.log('\n🎯 FRONTEND CONVERSION TEST:');
      console.log('============================');
      
      // Simulate the exact conversion that happens in CarAdvertEditPage.jsx
      const frontendRunningCosts = {
        fuelEconomy: {
          urban: String(car.runningCosts?.fuelEconomy?.urban || ''),
          extraUrban: String(car.runningCosts?.fuelEconomy?.extraUrban || ''),
          combined: String(car.runningCosts?.fuelEconomy?.combined || '')
        },
        annualTax: String(car.runningCosts?.annualTax || ''),
        insuranceGroup: String(car.runningCosts?.insuranceGroup || ''),
        co2Emissions: String(car.runningCosts?.co2Emissions || '')
      };
      
      console.log('Frontend advertData.runningCosts:');
      console.log(JSON.stringify(frontendRunningCosts, null, 2));
      
      console.log('\n✅ EXPECTED FRONTEND VALUES:');
      console.log('============================');
      console.log('Urban MPG input value:', `"${frontendRunningCosts.fuelEconomy.urban}"`);
      console.log('Extra Urban MPG input value:', `"${frontendRunningCosts.fuelEconomy.extraUrban}"`);
      console.log('Combined MPG input value:', `"${frontendRunningCosts.fuelEconomy.combined}"`);
      console.log('Annual Tax input value:', `"${frontendRunningCosts.annualTax}"`);
      console.log('CO2 Emissions input value:', `"${frontendRunningCosts.co2Emissions}"`);
      
      // Test MOT date formatting
      if (car.motDue) {
        const motDate = new Date(car.motDue);
        const formattedMOT = motDate.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        console.log('MOT Due formatted:', formattedMOT);
      }
      
      console.log('\n🚨 ISSUE ANALYSIS:');
      console.log('==================');
      
      if (frontendRunningCosts.fuelEconomy.combined === '') {
        console.log('❌ Combined MPG is empty string - will show placeholder');
      } else {
        console.log('✅ Combined MPG has value:', frontendRunningCosts.fuelEconomy.combined);
      }
      
      if (frontendRunningCosts.annualTax === '') {
        console.log('❌ Annual Tax is empty string - will show placeholder');
      } else {
        console.log('✅ Annual Tax has value:', frontendRunningCosts.annualTax);
      }
      
      if (frontendRunningCosts.co2Emissions === '') {
        console.log('❌ CO2 Emissions is empty string - will show placeholder');
      } else {
        console.log('✅ CO2 Emissions has value:', frontendRunningCosts.co2Emissions);
      }
      
    } else {
      console.log('❌ API call failed:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testVN73ETRFrontendAPI();