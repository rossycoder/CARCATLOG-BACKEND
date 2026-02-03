require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testFrontendDataFlow() {
  try {
    console.log('🔍 TESTING FRONTEND DATA FLOW');
    console.log('==============================');
    
    const carId = '6981fce2e32b03391ffd264b';
    const baseUrl = 'http://localhost:5000';
    
    const response = await axios.get(`${baseUrl}/api/vehicles/${carId}`);
    
    if (response.data.success) {
      const vehicleData = response.data.data;
      
      console.log('\n📊 SIMULATING FRONTEND LOGIC:');
      console.log('==============================');
      
      // Simulate the exact logic from CarAdvertEditPage.jsx line 193-205
      const advertData = {
        runningCosts: {
          fuelEconomy: {
            urban: vehicleData.runningCosts?.fuelEconomy?.urban || vehicleData.fuelEconomyUrban || '',
            extraUrban: vehicleData.runningCosts?.fuelEconomy?.extraUrban || vehicleData.fuelEconomyExtraUrban || '',
            combined: vehicleData.runningCosts?.fuelEconomy?.combined || vehicleData.fuelEconomyCombined || ''
          },
          annualTax: vehicleData.runningCosts?.annualTax || vehicleData.annualTax || '',
          insuranceGroup: vehicleData.runningCosts?.insuranceGroup || vehicleData.insuranceGroup || '',
          co2Emissions: vehicleData.runningCosts?.co2Emissions || vehicleData.co2Emissions || ''
        }
      };
      
      console.log('🎯 FRONTEND advertData.runningCosts:');
      console.log(JSON.stringify(advertData.runningCosts, null, 2));
      
      console.log('\n🔍 FIELD BY FIELD ANALYSIS:');
      console.log('============================');
      
      console.log('Combined MPG:');
      console.log('  - Database value:', vehicleData.runningCosts?.fuelEconomy?.combined);
      console.log('  - Frontend value:', advertData.runningCosts.fuelEconomy.combined);
      console.log('  - Type:', typeof advertData.runningCosts.fuelEconomy.combined);
      console.log('  - String conversion:', String(advertData.runningCosts.fuelEconomy.combined));
      console.log('  - Is empty?', advertData.runningCosts.fuelEconomy.combined === '');
      console.log('  - Is null?', advertData.runningCosts.fuelEconomy.combined === null);
      
      console.log('\nAnnual Tax:');
      console.log('  - Database value:', vehicleData.runningCosts?.annualTax);
      console.log('  - Frontend value:', advertData.runningCosts.annualTax);
      console.log('  - Type:', typeof advertData.runningCosts.annualTax);
      console.log('  - String conversion:', String(advertData.runningCosts.annualTax));
      console.log('  - Is empty?', advertData.runningCosts.annualTax === '');
      console.log('  - Is null?', advertData.runningCosts.annualTax === null);
      
      console.log('\nCO2 Emissions:');
      console.log('  - Database value:', vehicleData.runningCosts?.co2Emissions);
      console.log('  - Frontend value:', advertData.runningCosts.co2Emissions);
      console.log('  - Type:', typeof advertData.runningCosts.co2Emissions);
      console.log('  - String conversion:', String(advertData.runningCosts.co2Emissions));
      console.log('  - Is empty?', advertData.runningCosts.co2Emissions === '');
      console.log('  - Is null?', advertData.runningCosts.co2Emissions === null);
      
      console.log('\n🚨 ISSUE DETECTION:');
      console.log('===================');
      
      if (advertData.runningCosts.fuelEconomy.combined === null) {
        console.log('❌ Combined MPG is null - this will show as empty in frontend');
      } else if (advertData.runningCosts.fuelEconomy.combined === '') {
        console.log('❌ Combined MPG is empty string - this will show as empty in frontend');
      } else if (advertData.runningCosts.fuelEconomy.combined) {
        console.log('✅ Combined MPG has value - should show in frontend');
      }
      
      if (advertData.runningCosts.annualTax === null) {
        console.log('❌ Annual Tax is null - this will show as empty in frontend');
      } else if (advertData.runningCosts.annualTax === '') {
        console.log('❌ Annual Tax is empty string - this will show as empty in frontend');
      } else if (advertData.runningCosts.annualTax) {
        console.log('✅ Annual Tax has value - should show in frontend');
      }
      
      console.log('\n💡 SOLUTION:');
      console.log('=============');
      console.log('The frontend should convert numbers to strings:');
      
      const fixedAdvertData = {
        runningCosts: {
          fuelEconomy: {
            urban: String(vehicleData.runningCosts?.fuelEconomy?.urban || ''),
            extraUrban: String(vehicleData.runningCosts?.fuelEconomy?.extraUrban || ''),
            combined: String(vehicleData.runningCosts?.fuelEconomy?.combined || '')
          },
          annualTax: String(vehicleData.runningCosts?.annualTax || ''),
          insuranceGroup: String(vehicleData.runningCosts?.insuranceGroup || ''),
          co2Emissions: String(vehicleData.runningCosts?.co2Emissions || '')
        }
      };
      
      console.log('\n🔧 FIXED advertData.runningCosts:');
      console.log(JSON.stringify(fixedAdvertData.runningCosts, null, 2));
      
      console.log('\n✅ EXPECTED FRONTEND DISPLAY:');
      console.log('=============================');
      console.log('Combined MPG:', fixedAdvertData.runningCosts.fuelEconomy.combined || 'EMPTY');
      console.log('Annual Tax:', fixedAdvertData.runningCosts.annualTax || 'EMPTY');
      console.log('CO2 Emissions:', fixedAdvertData.runningCosts.co2Emissions || 'EMPTY');
      
    } else {
      console.log('❌ Failed to fetch car data');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFrontendDataFlow();