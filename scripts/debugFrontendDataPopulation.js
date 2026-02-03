require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function debugFrontendDataPopulation() {
  try {
    console.log('🔍 DEBUGGING FRONTEND DATA POPULATION');
    console.log('=====================================');
    
    const carId = '6981fce2e32b03391ffd264b';
    const baseUrl = 'http://localhost:5000';
    
    // Test the exact API call sequence that happens in CarAdvertEditPage.jsx
    console.log('1️⃣ Testing /api/vehicles/:id (primary API call)...');
    const vehicleResponse = await axios.get(`${baseUrl}/api/vehicles/${carId}`);
    
    if (vehicleResponse.data && vehicleResponse.data.data) {
      const vehicleData = vehicleResponse.data.data;
      
      console.log('✅ Vehicle data received');
      console.log('Registration:', vehicleData.registrationNumber);
      console.log('Advert Status:', vehicleData.advertStatus);
      
      // Simulate the exact logic from CarAdvertEditPage.jsx loadAdvertData function
      console.log('\n2️⃣ Simulating CarAdvertEditPage.jsx data population...');
      
      // This is the exact code from lines 190-207 in CarAdvertEditPage.jsx
      const advertData = {
        price: vehicleData.valuation?.privatePrice || 
               vehicleData.allValuations?.private || 
               vehicleData.price || '',
        description: vehicleData.description || '',
        photos: vehicleData.images || [],
        contactPhone: vehicleData.sellerContact?.phoneNumber || '',
        contactEmail: vehicleData.sellerContact?.email || '',
        location: vehicleData.postcode || '',
        features: vehicleData.features || [],
        runningCosts: {
          fuelEconomy: {
            urban: String(vehicleData.runningCosts?.fuelEconomy?.urban || ''),
            extraUrban: String(vehicleData.runningCosts?.fuelEconomy?.extraUrban || ''),
            combined: String(vehicleData.runningCosts?.fuelEconomy?.combined || '')
          },
          annualTax: String(vehicleData.runningCosts?.annualTax || ''),
          insuranceGroup: String(vehicleData.runningCosts?.insuranceGroup || ''),
          co2Emissions: String(vehicleData.runningCosts?.co2Emissions || '')
        },
        videoUrl: vehicleData.videoUrl || ''
      };
      
      console.log('\n📊 SIMULATED advertData.runningCosts:');
      console.log('====================================');
      console.log(JSON.stringify(advertData.runningCosts, null, 2));
      
      console.log('\n🎯 AutoFillField PROPS SIMULATION:');
      console.log('==================================');
      console.log('Combined MPG AutoFillField props:');
      console.log('  value:', `"${advertData.runningCosts.fuelEconomy.combined}"`);
      console.log('  type: "number"');
      console.log('  placeholder: "e.g. 45.8"');
      
      console.log('\nAnnual Tax AutoFillField props:');
      console.log('  value:', `"${advertData.runningCosts.annualTax}"`);
      console.log('  type: "number"');
      console.log('  placeholder: "e.g. 165"');
      
      console.log('\nCO2 Emissions AutoFillField props:');
      console.log('  value:', `"${advertData.runningCosts.co2Emissions}"`);
      console.log('  type: "number"');
      console.log('  placeholder: "e.g. 120"');
      
      console.log('\n🔍 VALUE ANALYSIS:');
      console.log('==================');
      
      const combinedValue = advertData.runningCosts.fuelEconomy.combined;
      const annualTaxValue = advertData.runningCosts.annualTax;
      const co2Value = advertData.runningCosts.co2Emissions;
      
      console.log('Combined MPG:');
      console.log('  Raw value:', vehicleData.runningCosts?.fuelEconomy?.combined);
      console.log('  String value:', combinedValue);
      console.log('  Is empty?', combinedValue === '');
      console.log('  Length:', combinedValue.length);
      console.log('  Will show in input?', combinedValue !== '' ? 'YES' : 'NO (will show placeholder)');
      
      console.log('\nAnnual Tax:');
      console.log('  Raw value:', vehicleData.runningCosts?.annualTax);
      console.log('  String value:', annualTaxValue);
      console.log('  Is empty?', annualTaxValue === '');
      console.log('  Length:', annualTaxValue.length);
      console.log('  Will show in input?', annualTaxValue !== '' ? 'YES' : 'NO (will show placeholder)');
      
      console.log('\nCO2 Emissions:');
      console.log('  Raw value:', vehicleData.runningCosts?.co2Emissions);
      console.log('  String value:', co2Value);
      console.log('  Is empty?', co2Value === '');
      console.log('  Length:', co2Value.length);
      console.log('  Will show in input?', co2Value !== '' ? 'YES' : 'NO (will show placeholder)');
      
      console.log('\n🔧 MOT DUE ANALYSIS:');
      console.log('====================');
      console.log('MOT Due raw:', vehicleData.motDue);
      console.log('MOT Status:', vehicleData.motStatus);
      
      if (vehicleData.motDue) {
        const motDate = new Date(vehicleData.motDue);
        const formatted = motDate.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        console.log('MOT Due formatted:', formatted);
        console.log('Should show in frontend:', formatted);
      } else {
        console.log('No MOT due date - will show "Contact seller for MOT details"');
      }
      
      console.log('\n💡 DEBUGGING RECOMMENDATIONS:');
      console.log('=============================');
      console.log('1. Open browser dev tools on the edit page');
      console.log('2. Look for console.log messages:');
      console.log('   - "🏃 Full advertData.runningCosts:"');
      console.log('   - "🔧 MOT Debug:"');
      console.log('3. Check if advertData state matches the values above');
      console.log('4. Verify AutoFillField components receive correct props');
      console.log('5. Check if there are any React state update issues');
      
    } else {
      console.log('❌ No vehicle data received from API');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugFrontendDataPopulation();