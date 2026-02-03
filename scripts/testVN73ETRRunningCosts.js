require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testVN73ETRRunningCosts() {
  try {
    const registration = 'VN73ETR';
    const mileage = 2500;
    
    console.log(`🧪 Testing VN73ETR Running Costs & Price`);
    console.log(`   Registration: ${registration}`);
    console.log(`   Mileage: ${mileage}`);
    console.log('=====================================');

    // 1. Test complete vehicle data (includes running costs)
    console.log('\n📡 Fetching complete vehicle data...');
    const vehicleData = await CheckCarDetailsClient.getVehicleData(registration);
    
    if (vehicleData) {
      console.log('✅ Vehicle data received:');
      console.log(`   Make/Model: ${vehicleData.make} ${vehicleData.model}`);
      console.log(`   Body Type: ${vehicleData.bodyType}`);
      console.log(`   Fuel Type: ${vehicleData.fuelType}`);
      
      // Check running costs
      console.log('\n🏃 Running Costs Data:');
      if (vehicleData.fuelEconomy) {
        console.log(`   Urban MPG: ${vehicleData.fuelEconomy.urban || 'N/A'}`);
        console.log(`   Extra Urban MPG: ${vehicleData.fuelEconomy.extraUrban || 'N/A'}`);
        console.log(`   Combined MPG: ${vehicleData.fuelEconomy.combined || 'N/A'}`);
      } else {
        console.log('   ❌ No fuel economy data');
      }
      
      console.log(`   CO2 Emissions: ${vehicleData.co2Emissions || 'N/A'} g/km`);
      console.log(`   Annual Tax: £${vehicleData.annualTax || 'N/A'}`);
      console.log(`   Insurance Group: ${vehicleData.insuranceGroup || 'N/A'}`);
      
      // Check performance data
      console.log('\n⚡ Performance Data:');
      if (vehicleData.performance) {
        console.log(`   Power: ${vehicleData.performance.power || 'N/A'} BHP`);
        console.log(`   Torque: ${vehicleData.performance.torque || 'N/A'} Nm`);
        console.log(`   0-60 mph: ${vehicleData.performance.acceleration || 'N/A'} seconds`);
        console.log(`   Top Speed: ${vehicleData.performance.topSpeed || 'N/A'} mph`);
      } else {
        console.log('   ❌ No performance data');
      }
    }

    // 2. Test valuation separately
    console.log('\n💰 Testing Valuation...');
    try {
      const valuationData = await CheckCarDetailsClient.getVehicleValuation(registration);
      
      if (valuationData) {
        console.log('✅ Valuation data received (raw):');
        console.log(JSON.stringify(valuationData, null, 2));
        
        // Parse valuation
        const parsedValuation = CheckCarDetailsClient.parseValuationResponse(valuationData);
        console.log('\n💰 Parsed Valuation:');
        console.log(`   Private Price: £${parsedValuation.privatePrice || 'N/A'}`);
        console.log(`   Dealer Price: £${parsedValuation.dealerPrice || 'N/A'}`);
        console.log(`   Part Exchange: £${parsedValuation.partExchangePrice || 'N/A'}`);
        console.log(`   Trade Price: £${parsedValuation.tradePrice || 'N/A'}`);
      } else {
        console.log('❌ No valuation data received');
      }
    } catch (valuationError) {
      console.log('❌ Valuation error:', valuationError.message);
    }

    // 3. Test what frontend would get
    console.log('\n🖥️ Frontend API Response Simulation:');
    const frontendResponse = {
      success: true,
      data: {
        make: vehicleData.make,
        model: vehicleData.model,
        bodyType: vehicleData.bodyType,
        fuelType: vehicleData.fuelType,
        year: vehicleData.year,
        mileage: mileage,
        // Running costs for frontend
        fuelEconomy: vehicleData.fuelEconomy,
        co2Emissions: vehicleData.co2Emissions,
        annualTax: vehicleData.annualTax,
        insuranceGroup: vehicleData.insuranceGroup,
        // Performance data
        performance: vehicleData.performance,
        // Valuation (would come from separate API call)
        estimatedValue: {
          private: 83084, // This should come from valuation API
          retail: 85000,
          partExchange: 78000
        }
      }
    };
    
    console.log('📱 What frontend should receive:');
    console.log(JSON.stringify(frontendResponse, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

testVN73ETRRunningCosts();