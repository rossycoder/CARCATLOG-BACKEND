require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testVN73ETRFrontendFlow() {
  try {
    console.log('🧪 Testing VN73ETR Frontend Flow');
    console.log('=================================');
    
    const carId = '6981fce2e32b03391ffd264b'; // VN73ETR car ID
    const baseUrl = 'http://localhost:5000';
    
    console.log(`📱 Simulating frontend request for car: ${carId}`);
    
    // 1. Test the vehicles endpoint (what frontend calls first)
    console.log('\n1️⃣ Testing /api/vehicles/:id endpoint...');
    try {
      const vehicleResponse = await axios.get(`${baseUrl}/api/vehicles/${carId}`);
      
      if (vehicleResponse.data.success) {
        const car = vehicleResponse.data.data;
        console.log('✅ Vehicle data loaded successfully');
        
        console.log('\n📊 Car Data from Database:');
        console.log('  Registration:', car.registrationNumber);
        console.log('  Body Type:', car.bodyType);
        console.log('  Fuel Type:', car.fuelType);
        console.log('  Price:', car.price);
        console.log('  Advert Status:', car.advertStatus);
        console.log('  User ID:', car.userId ? 'Present' : 'Missing');
        
        console.log('\n🏃 Running Costs in Database:');
        if (car.runningCosts) {
          console.log('  Urban MPG:', car.runningCosts.fuelEconomy?.urban || 'N/A');
          console.log('  Extra Urban MPG:', car.runningCosts.fuelEconomy?.extraUrban || 'N/A');
          console.log('  Combined MPG:', car.runningCosts.fuelEconomy?.combined || 'N/A');
          console.log('  Annual Tax:', car.runningCosts.annualTax || 'N/A');
          console.log('  CO2 Emissions:', car.runningCosts.co2Emissions || 'N/A');
          console.log('  Insurance Group:', car.runningCosts.insuranceGroup || 'N/A');
        } else {
          console.log('  ❌ No running costs in database');
        }
        
        console.log('\n💰 Valuation in Database:');
        if (car.valuation) {
          console.log('  Private Price:', car.valuation.privatePrice || 'N/A');
          console.log('  Retail Price:', car.valuation.retailPrice || 'N/A');
          console.log('  Trade Price:', car.valuation.tradePrice || 'N/A');
        } else {
          console.log('  ❌ No valuation in database');
        }
        
        console.log('\n🔧 MOT Data in Database:');
        console.log('  MOT Status:', car.motStatus || 'N/A');
        console.log('  MOT Due:', car.motDue || 'N/A');
        
        // 2. Check if frontend would need to fetch enhanced data
        const needsValuation = !car.valuation?.privatePrice && !car.allValuations?.private;
        const needsRunningCosts = !car.runningCosts?.annualTax;
        const needsEnhancedData = needsValuation || needsRunningCosts;
        const isNewUserCar = car.advertStatus === 'draft' || car.advertStatus === 'pending_payment';
        
        console.log('\n🔍 Enhanced Data Check:');
        console.log('  Needs Valuation:', needsValuation);
        console.log('  Needs Running Costs:', needsRunningCosts);
        console.log('  Needs Enhanced Data:', needsEnhancedData);
        console.log('  Is New User Car:', isNewUserCar);
        console.log('  Should Fetch API:', isNewUserCar || needsEnhancedData);
        
        // 3. If frontend would fetch enhanced data, test that
        if (car.registrationNumber && (isNewUserCar || needsEnhancedData)) {
          console.log('\n2️⃣ Frontend would fetch enhanced data...');
          console.log(`📡 Testing enhanced lookup for ${car.registrationNumber}`);
          
          try {
            const enhancedResponse = await axios.get(
              `${baseUrl}/api/vehicles/enhanced-lookup/${car.registrationNumber}?mileage=${car.mileage || 2500}`
            );
            
            if (enhancedResponse.data.success) {
              const enhanced = enhancedResponse.data.data;
              console.log('✅ Enhanced data fetched successfully');
              
              console.log('\n🏃 Enhanced Running Costs:');
              if (enhanced.runningCosts) {
                console.log('  Urban MPG:', enhanced.runningCosts.fuelEconomy?.urban || 'N/A');
                console.log('  Extra Urban MPG:', enhanced.runningCosts.fuelEconomy?.extraUrban || 'N/A');
                console.log('  Combined MPG:', enhanced.runningCosts.fuelEconomy?.combined || 'N/A');
                console.log('  Annual Tax:', enhanced.runningCosts.annualTax || 'N/A');
                console.log('  CO2 Emissions:', enhanced.runningCosts.co2Emissions || 'N/A');
                console.log('  Insurance Group:', enhanced.runningCosts.insuranceGroup || 'N/A');
              } else {
                console.log('  ❌ No running costs in enhanced data');
              }
              
              console.log('\n💰 Enhanced Valuation:');
              if (enhanced.valuation?.estimatedValue) {
                console.log('  Private Price:', enhanced.valuation.estimatedValue.private || 'N/A');
                console.log('  Retail Price:', enhanced.valuation.estimatedValue.retail || 'N/A');
                console.log('  Trade Price:', enhanced.valuation.estimatedValue.trade || 'N/A');
              } else {
                console.log('  ❌ No valuation in enhanced data');
              }
            } else {
              console.log('❌ Enhanced data fetch failed:', enhancedResponse.data.error);
            }
          } catch (enhancedError) {
            console.log('❌ Enhanced data fetch error:', enhancedError.message);
          }
        } else {
          console.log('\n2️⃣ Frontend would NOT fetch enhanced data (data already in database)');
        }
        
        // 4. Final assessment
        console.log('\n📋 FRONTEND BEHAVIOR ASSESSMENT:');
        console.log('================================');
        
        if (car.runningCosts?.fuelEconomy?.combined) {
          console.log('✅ Combined MPG should show:', car.runningCosts.fuelEconomy.combined);
        } else {
          console.log('❌ Combined MPG will be empty (no data in database)');
        }
        
        if (car.runningCosts?.annualTax) {
          console.log('✅ Annual Tax should show: £' + car.runningCosts.annualTax);
        } else {
          console.log('❌ Annual Tax will be empty (no data in database)');
        }
        
        if (car.runningCosts?.co2Emissions) {
          console.log('✅ CO2 Emissions should show:', car.runningCosts.co2Emissions + ' g/km');
        } else {
          console.log('❌ CO2 Emissions will be empty (no data in database)');
        }
        
        if (car.bodyType === 'SUV') {
          console.log('✅ Body Type should show: SUV');
        } else {
          console.log('❌ Body Type will show:', car.bodyType);
        }
        
        if (car.motDue) {
          console.log('✅ MOT Due should show:', new Date(car.motDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
        } else {
          console.log('❌ MOT Due will show: Contact seller for MOT details');
        }
        
        console.log('\n🌐 Frontend URL:');
        console.log(`http://localhost:3000/selling/advert/edit/${carId}`);
        
      } else {
        console.log('❌ Vehicle data fetch failed:', vehicleResponse.data.error);
      }
    } catch (vehicleError) {
      console.log('❌ Vehicle endpoint error:', vehicleError.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testVN73ETRFrontendFlow();