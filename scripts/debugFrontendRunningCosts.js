require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function debugFrontendRunningCosts() {
  try {
    console.log('🔍 DEBUGGING FRONTEND RUNNING COSTS');
    console.log('===================================');
    
    const carId = '6981fce2e32b03391ffd264b';
    const baseUrl = 'http://localhost:5000';
    
    // Test the exact API call that frontend makes
    console.log('1️⃣ Testing /api/vehicles/:id (what frontend calls first)...');
    const response = await axios.get(`${baseUrl}/api/vehicles/${carId}`);
    
    if (response.data.success) {
      const car = response.data.data;
      
      console.log('\n📊 RAW DATABASE DATA:');
      console.log('=====================');
      console.log('Full runningCosts object:', JSON.stringify(car.runningCosts, null, 2));
      
      console.log('\n🔍 DETAILED FIELD ANALYSIS:');
      console.log('============================');
      
      if (car.runningCosts) {
        console.log('✅ runningCosts object exists');
        
        // Check fuelEconomy
        if (car.runningCosts.fuelEconomy) {
          console.log('✅ fuelEconomy object exists');
          console.log('  - urban:', car.runningCosts.fuelEconomy.urban, typeof car.runningCosts.fuelEconomy.urban);
          console.log('  - extraUrban:', car.runningCosts.fuelEconomy.extraUrban, typeof car.runningCosts.fuelEconomy.extraUrban);
          console.log('  - combined:', car.runningCosts.fuelEconomy.combined, typeof car.runningCosts.fuelEconomy.combined);
        } else {
          console.log('❌ fuelEconomy object missing');
        }
        
        // Check other fields
        console.log('  - annualTax:', car.runningCosts.annualTax, typeof car.runningCosts.annualTax);
        console.log('  - co2Emissions:', car.runningCosts.co2Emissions, typeof car.runningCosts.co2Emissions);
        console.log('  - insuranceGroup:', car.runningCosts.insuranceGroup, typeof car.runningCosts.insuranceGroup);
      } else {
        console.log('❌ runningCosts object missing completely');
      }
      
      console.log('\n🎯 FRONTEND EXPECTATION:');
      console.log('========================');
      console.log('Frontend expects these values:');
      console.log('  - Combined MPG: "470.8" (string)');
      console.log('  - Annual Tax: "195" (string)');
      console.log('  - CO2 Emissions: "17" (string)');
      
      console.log('\n🔧 CONVERSION CHECK:');
      console.log('====================');
      if (car.runningCosts) {
        const combined = car.runningCosts.fuelEconomy?.combined;
        const annualTax = car.runningCosts.annualTax;
        const co2 = car.runningCosts.co2Emissions;
        
        console.log('Combined MPG conversion:');
        console.log('  - Raw value:', combined);
        console.log('  - String value:', String(combined || ''));
        console.log('  - Will show in frontend:', String(combined || '') || 'EMPTY');
        
        console.log('Annual Tax conversion:');
        console.log('  - Raw value:', annualTax);
        console.log('  - String value:', String(annualTax || ''));
        console.log('  - Will show in frontend:', String(annualTax || '') || 'EMPTY');
        
        console.log('CO2 Emissions conversion:');
        console.log('  - Raw value:', co2);
        console.log('  - String value:', String(co2 || ''));
        console.log('  - Will show in frontend:', String(co2 || '') || 'EMPTY');
      }
      
      console.log('\n🔍 MOT DATA CHECK:');
      console.log('==================');
      console.log('MOT Status:', car.motStatus);
      console.log('MOT Due:', car.motDue);
      console.log('MOT Expiry:', car.motExpiry);
      
      if (car.motDue) {
        const motDate = new Date(car.motDue);
        const formattedDate = motDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        console.log('Formatted MOT Date:', formattedDate);
      }
      
      console.log('\n🚨 POTENTIAL ISSUES:');
      console.log('====================');
      
      // Check for null/undefined values
      if (car.runningCosts?.fuelEconomy?.combined === null) {
        console.log('⚠️ Combined MPG is null - should be 470.8');
      }
      if (car.runningCosts?.annualTax === null) {
        console.log('⚠️ Annual Tax is null - should be 195');
      }
      if (!car.motDue) {
        console.log('⚠️ MOT Due is missing');
      }
      
      console.log('\n💡 FRONTEND DEBUG TIPS:');
      console.log('=======================');
      console.log('1. Open browser console on the edit page');
      console.log('2. Look for these console.log messages:');
      console.log('   - "🏃 Updating running costs from enhanced data"');
      console.log('   - "🏃 New running costs to set"');
      console.log('   - "✅ Form fields populated with existing data"');
      console.log('3. Check if advertData.runningCosts has the correct values');
      console.log('4. Verify AutoFillField components are receiving correct props');
      
    } else {
      console.log('❌ Failed to fetch car data');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugFrontendRunningCosts();