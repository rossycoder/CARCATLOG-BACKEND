require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testFrontendRunningCostsFix() {
  try {
    console.log('🔍 TESTING FRONTEND RUNNING COSTS FIX');
    console.log('====================================');
    
    const carId = '6981fce2e32b03391ffd264b';
    const baseUrl = 'http://localhost:5000';
    
    const response = await axios.get(`${baseUrl}/api/vehicles/${carId}`);
    
    if (response.data.success) {
      const vehicleData = response.data.data;
      
      console.log('\n📊 DATABASE VALUES:');
      console.log('===================');
      console.log('Combined MPG:', vehicleData.runningCosts?.fuelEconomy?.combined);
      console.log('Annual Tax:', vehicleData.runningCosts?.annualTax);
      console.log('CO2 Emissions:', vehicleData.runningCosts?.co2Emissions);
      console.log('MOT Due:', vehicleData.motDue);
      console.log('MOT Status:', vehicleData.motStatus);
      
      console.log('\n🎯 FRONTEND CONVERSION (what AutoFillField will receive):');
      console.log('========================================================');
      
      const frontendValues = {
        combined: String(vehicleData.runningCosts?.fuelEconomy?.combined || ''),
        annualTax: String(vehicleData.runningCosts?.annualTax || ''),
        co2Emissions: String(vehicleData.runningCosts?.co2Emissions || ''),
        motDue: vehicleData.motDue
      };
      
      console.log('Combined MPG value prop:', `"${frontendValues.combined}"`);
      console.log('Annual Tax value prop:', `"${frontendValues.annualTax}"`);
      console.log('CO2 Emissions value prop:', `"${frontendValues.co2Emissions}"`);
      
      // Test MOT date formatting
      if (frontendValues.motDue) {
        const dateStr = frontendValues.motDue;
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          console.log('MOT Due formatted:', formatted);
        }
      }
      
      console.log('\n✅ EXPECTED RESULTS:');
      console.log('====================');
      console.log('1. Running costs section should be EXPANDED by default');
      console.log('2. Combined MPG field should show: 470.8');
      console.log('3. Annual Tax field should show: 195');
      console.log('4. CO2 Emissions field should show: 17');
      console.log('5. MOT Due should show: 31 October 2026');
      
      console.log('\n🔧 DEBUGGING STEPS:');
      console.log('===================');
      console.log('1. Open the car advert edit page in browser');
      console.log('2. Check browser console for these messages:');
      console.log('   - "🏃 Full advertData.runningCosts:"');
      console.log('   - "🔧 MOT Debug:"');
      console.log('3. Verify running costs section is expanded');
      console.log('4. Check if AutoFillField components have correct values');
      
    } else {
      console.log('❌ Failed to fetch car data');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFrontendRunningCostsFix();