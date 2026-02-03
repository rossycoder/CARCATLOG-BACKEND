require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function finalVN73ETRTest() {
  try {
    console.log('🎯 FINAL VN73ETR TEST');
    console.log('====================');
    
    const carId = '6981fce2e32b03391ffd264b';
    const baseUrl = 'http://localhost:5000';
    
    console.log('📱 Testing what frontend will receive...\n');
    
    // Test the vehicles endpoint (what frontend calls)
    const response = await axios.get(`${baseUrl}/api/vehicles/${carId}`);
    
    if (response.data.success) {
      const car = response.data.data;
      
      console.log('🚗 VEHICLE INFO:');
      console.log('================');
      console.log(`✅ Make/Model: ${car.make} ${car.model}`);
      console.log(`✅ Body Type: ${car.bodyType} ${car.bodyType === 'SUV' ? '✅' : '❌'}`);
      console.log(`✅ Fuel Type: ${car.fuelType}`);
      console.log(`✅ Year: ${car.year}`);
      console.log(`✅ Price: £${car.price?.toLocaleString()}`);
      console.log(`✅ User ID: ${car.userId ? 'Present ✅' : 'Missing ❌'}`);
      
      console.log('\n🏃 RUNNING COSTS:');
      console.log('=================');
      if (car.runningCosts) {
        const urban = car.runningCosts.fuelEconomy?.urban;
        const extraUrban = car.runningCosts.fuelEconomy?.extraUrban;
        const combined = car.runningCosts.fuelEconomy?.combined;
        const annualTax = car.runningCosts.annualTax;
        const co2 = car.runningCosts.co2Emissions;
        const insurance = car.runningCosts.insuranceGroup;
        
        console.log(`${urban ? '✅' : '⚪'} Urban MPG: ${urban || 'N/A'} ${urban ? '' : '(expected for hybrid)'}`);
        console.log(`${extraUrban ? '✅' : '⚪'} Extra Urban MPG: ${extraUrban || 'N/A'} ${extraUrban ? '' : '(expected for hybrid)'}`);
        console.log(`${combined ? '✅' : '❌'} Combined MPG: ${combined || 'N/A'} ${combined === 470.8 ? '✅ CORRECT' : combined ? '⚠️ UNEXPECTED VALUE' : '❌ MISSING'}`);
        console.log(`${annualTax ? '✅' : '❌'} Annual Tax: £${annualTax || 'N/A'} ${annualTax === 195 ? '✅ CORRECT' : annualTax ? '⚠️ UNEXPECTED VALUE' : '❌ MISSING'}`);
        console.log(`${co2 ? '✅' : '❌'} CO2 Emissions: ${co2 || 'N/A'} g/km ${co2 === 17 ? '✅ CORRECT' : co2 ? '⚠️ UNEXPECTED VALUE' : '❌ MISSING'}`);
        console.log(`${insurance ? '✅' : '⚪'} Insurance Group: ${insurance || 'N/A'} ${insurance ? '' : '(expected - not available)'}`);
      } else {
        console.log('❌ NO RUNNING COSTS DATA IN DATABASE');
      }
      
      console.log('\n💰 VALUATION:');
      console.log('=============');
      if (car.valuation) {
        console.log(`✅ Private Price: £${car.valuation.privatePrice?.toLocaleString() || 'N/A'}`);
        console.log(`✅ Retail Price: £${car.valuation.retailPrice?.toLocaleString() || 'N/A'}`);
        console.log(`✅ Trade Price: £${car.valuation.tradePrice?.toLocaleString() || 'N/A'}`);
      } else {
        console.log('⚠️ No valuation object in database');
      }
      
      if (car.allValuations) {
        console.log(`✅ All Valuations Available: Private £${car.allValuations.private?.toLocaleString()}, Retail £${car.allValuations.retail?.toLocaleString()}`);
      }
      
      console.log('\n🔧 MOT DATA:');
      console.log('============');
      console.log(`${car.motStatus ? '✅' : '❌'} MOT Status: ${car.motStatus || 'N/A'}`);
      if (car.motDue) {
        const motDate = new Date(car.motDue);
        const formattedDate = motDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        console.log(`✅ MOT Due: ${formattedDate} ${formattedDate.includes('2026') ? '✅ CORRECT' : '⚠️ UNEXPECTED'}`);
      } else {
        console.log('❌ MOT Due: N/A');
      }
      
      console.log('\n📊 FRONTEND BEHAVIOR PREDICTION:');
      console.log('=================================');
      
      // Check if frontend would fetch enhanced data
      const needsValuation = !car.valuation?.privatePrice && !car.allValuations?.private;
      const needsRunningCosts = !car.runningCosts?.annualTax;
      const needsEnhancedData = needsValuation || needsRunningCosts;
      const isNewUserCar = car.advertStatus === 'draft' || car.advertStatus === 'pending_payment';
      
      console.log(`📋 Advert Status: ${car.advertStatus}`);
      console.log(`📋 Needs Enhanced Data: ${needsEnhancedData ? 'YES' : 'NO'}`);
      console.log(`📋 Is New User Car: ${isNewUserCar ? 'YES' : 'NO'}`);
      console.log(`📋 Will Fetch API: ${isNewUserCar || needsEnhancedData ? 'YES ⚠️' : 'NO ✅'}`);
      
      if (needsEnhancedData || isNewUserCar) {
        console.log('⚠️ Frontend will make API calls - data should be in database instead');
      } else {
        console.log('✅ Frontend will use database data - no API calls needed');
      }
      
      console.log('\n🌐 FRONTEND URLS:');
      console.log('=================');
      console.log(`🖥️ Car Edit Page: http://localhost:3001/selling/advert/edit/${carId}`);
      console.log(`📱 Car Detail Page: http://localhost:3001/car/${carId}`);
      
      console.log('\n🎯 EXPECTED FRONTEND RESULTS:');
      console.log('=============================');
      console.log('When you visit the edit page, you should see:');
      console.log(`✅ Body Type: SUV`);
      console.log(`✅ Fuel Type: Hybrid`);
      console.log(`✅ Price: £83,084`);
      console.log(`✅ MOT: Not due until 31 October 2026`);
      console.log('');
      console.log('In the Running Costs section (when expanded):');
      console.log(`${car.runningCosts?.fuelEconomy?.combined ? '✅' : '❌'} Combined MPG: ${car.runningCosts?.fuelEconomy?.combined || 'MISSING'}`);
      console.log(`${car.runningCosts?.annualTax ? '✅' : '❌'} Annual Tax: £${car.runningCosts?.annualTax || 'MISSING'}`);
      console.log(`${car.runningCosts?.co2Emissions ? '✅' : '❌'} CO2 Emissions: ${car.runningCosts?.co2Emissions || 'MISSING'} g/km`);
      
      // Final assessment
      const allDataPresent = car.bodyType === 'SUV' && 
                           car.runningCosts?.fuelEconomy?.combined === 470.8 &&
                           car.runningCosts?.annualTax === 195 &&
                           car.runningCosts?.co2Emissions === 17 &&
                           car.motStatus === 'Not due' &&
                           car.userId;
      
      console.log('\n🏆 FINAL RESULT:');
      console.log('================');
      if (allDataPresent) {
        console.log('🎉 SUCCESS! All data is correct and present in database');
        console.log('✅ VN73ETR should display perfectly in frontend');
        console.log('✅ No API calls needed - all data from database');
      } else {
        console.log('⚠️ Some data is missing or incorrect');
        console.log('🔧 Check the issues above and fix as needed');
      }
      
    } else {
      console.log('❌ Failed to fetch car data:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure backend server is running: cd backend && npm start');
    }
  }
}

finalVN73ETRTest();