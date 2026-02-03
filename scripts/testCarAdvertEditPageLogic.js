const axios = require('axios');

async function testCarAdvertEditPageLogic() {
  try {
    console.log('🔍 Testing CarAdvertEditPage Logic');
    console.log('='.repeat(50));
    
    const carId = '69813278a666da47e6890935'; // EK11XHZ car
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Step 1: Fetch car data (like CarAdvertEditPage does)
    console.log(`\n1️⃣ Fetching car data from /api/vehicles/${carId}`);
    const carResponse = await axios.get(`${baseURL}/api/vehicles/${carId}`);
    const vehicleData = carResponse.data.data;
    
    console.log('🚗 Car data received:');
    console.log(`   Registration: ${vehicleData.registrationNumber}`);
    console.log(`   Price: £${vehicleData.price}`);
    console.log(`   Has valuation: ${!!vehicleData.valuation}`);
    console.log(`   Has running costs: ${!!vehicleData.runningCosts?.annualTax}`);
    
    // Step 2: Check if enhanced data is needed (new logic)
    const needsValuation = !vehicleData.valuation?.privatePrice && !vehicleData.allValuations?.private;
    const needsRunningCosts = !vehicleData.runningCosts?.annualTax;
    const needsEnhancedData = needsValuation || needsRunningCosts;
    
    console.log('\n2️⃣ Enhanced data check:');
    console.log(`   Needs valuation: ${needsValuation}`);
    console.log(`   Needs running costs: ${needsRunningCosts}`);
    console.log(`   Needs enhanced data: ${needsEnhancedData}`);
    
    // Step 3: If enhanced data is needed, fetch it
    if (needsEnhancedData && vehicleData.registrationNumber) {
      console.log(`\n3️⃣ Fetching enhanced data for ${vehicleData.registrationNumber}`);
      const enhancedUrl = `${baseURL}/api/vehicles/enhanced-lookup/${vehicleData.registrationNumber}?mileage=${vehicleData.mileage || 50000}`;
      console.log(`   URL: ${enhancedUrl}`);
      
      const enhancedResponse = await axios.get(enhancedUrl);
      const enhancedData = enhancedResponse.data.data;
      
      console.log('✅ Enhanced data received:');
      console.log(`   Has valuation: ${!!enhancedData.valuation}`);
      console.log(`   Has running costs: ${!!enhancedData.runningCosts}`);
      
      if (enhancedData.valuation) {
        console.log(`   Private price: £${enhancedData.valuation.estimatedValue?.private}`);
      }
      
      if (enhancedData.runningCosts) {
        console.log(`   Urban MPG: ${enhancedData.runningCosts.fuelEconomy?.urban}`);
        console.log(`   Combined MPG: ${enhancedData.runningCosts.fuelEconomy?.combined}`);
        console.log(`   Annual Tax: £${enhancedData.runningCosts.annualTax}`);
        console.log(`   CO2: ${enhancedData.runningCosts.co2Emissions}g/km`);
      }
      
      // Step 4: Simulate form data population
      console.log('\n4️⃣ Form data that would be populated:');
      const formData = {
        price: enhancedData.valuation?.estimatedValue?.private || vehicleData.price,
        runningCosts: {
          fuelEconomy: {
            urban: enhancedData.runningCosts?.fuelEconomy?.urban || '',
            extraUrban: enhancedData.runningCosts?.fuelEconomy?.extraUrban || '',
            combined: enhancedData.runningCosts?.fuelEconomy?.combined || ''
          },
          annualTax: enhancedData.runningCosts?.annualTax || '',
          co2Emissions: enhancedData.runningCosts?.co2Emissions || ''
        }
      };
      
      console.log(`   Price: £${formData.price}`);
      console.log(`   Urban MPG: ${formData.runningCosts.fuelEconomy.urban}`);
      console.log(`   Combined MPG: ${formData.runningCosts.fuelEconomy.combined}`);
      console.log(`   Annual Tax: £${formData.runningCosts.annualTax}`);
      console.log(`   CO2: ${formData.runningCosts.co2Emissions}g/km`);
      
    } else {
      console.log('\n3️⃣ No enhanced data needed - using existing data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCarAdvertEditPageLogic();