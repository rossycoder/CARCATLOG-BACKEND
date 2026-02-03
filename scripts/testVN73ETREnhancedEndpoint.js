require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testVN73ETREnhancedEndpoint() {
  try {
    const registration = 'VN73ETR';
    const mileage = 2500;
    
    console.log(`🧪 Testing Enhanced Lookup Endpoint for: ${registration}`);
    console.log('=====================================');

    // Test the actual endpoint that frontend calls
    const baseUrl = 'http://localhost:5000'; // Adjust if different
    const url = `${baseUrl}/api/vehicles/enhanced-lookup/${registration}?mileage=${mileage}`;
    
    console.log(`📡 Calling: ${url}`);
    
    try {
      const response = await axios.get(url);
      
      if (response.data.success) {
        console.log('✅ Enhanced lookup successful');
        
        const data = response.data.data;
        
        console.log('\n🔧 Basic Vehicle Info:');
        console.log(`   Make: ${data.make}`);
        console.log(`   Model: ${data.model}`);
        console.log(`   Body Type: ${data.bodyType}`);
        console.log(`   Fuel Type: ${data.fuelType}`);
        console.log(`   Year: ${data.year}`);
        
        console.log('\n💰 Valuation Data:');
        if (data.valuation) {
          console.log(`   Valuation object:`, data.valuation);
          if (data.valuation.estimatedValue) {
            console.log(`   Private Price: £${data.valuation.estimatedValue.private || 'N/A'}`);
            console.log(`   Retail Price: £${data.valuation.estimatedValue.retail || 'N/A'}`);
          }
        } else {
          console.log('   ❌ No valuation data');
        }
        
        console.log('\n🏃 Running Costs Data:');
        if (data.runningCosts) {
          console.log(`   Running costs object:`, data.runningCosts);
          
          if (data.runningCosts.fuelEconomy) {
            console.log(`   Urban MPG: ${data.runningCosts.fuelEconomy.urban || 'N/A'}`);
            console.log(`   Extra Urban MPG: ${data.runningCosts.fuelEconomy.extraUrban || 'N/A'}`);
            console.log(`   Combined MPG: ${data.runningCosts.fuelEconomy.combined || 'N/A'}`);
          }
          
          console.log(`   Annual Tax: £${data.runningCosts.annualTax || 'N/A'}`);
          console.log(`   CO2 Emissions: ${data.runningCosts.co2Emissions || 'N/A'} g/km`);
          console.log(`   Insurance Group: ${data.runningCosts.insuranceGroup || 'N/A'}`);
        } else {
          console.log('   ❌ No running costs data');
        }
        
        // Check individual fields that might be at root level
        console.log('\n📊 Root Level Fields:');
        console.log(`   urbanMpg: ${data.urbanMpg || 'N/A'}`);
        console.log(`   extraUrbanMpg: ${data.extraUrbanMpg || 'N/A'}`);
        console.log(`   combinedMpg: ${data.combinedMpg || 'N/A'}`);
        console.log(`   annualTax: ${data.annualTax || 'N/A'}`);
        console.log(`   co2Emissions: ${data.co2Emissions || 'N/A'}`);
        console.log(`   insuranceGroup: ${data.insuranceGroup || 'N/A'}`);
        
        console.log('\n🔧 MOT Data:');
        console.log(`   MOT Status: ${data.motStatus || 'N/A'}`);
        console.log(`   MOT Due: ${data.motDue || data.motExpiry || 'N/A'}`);
        if (data.motHistory && data.motHistory.length > 0) {
          console.log(`   MOT History: ${data.motHistory.length} records`);
        } else {
          console.log(`   MOT History: No records (new car)`);
        }
        
        console.log('\n📱 What Frontend Should Receive:');
        const frontendFormat = {
          // Basic info
          make: data.make,
          model: data.model,
          bodyType: data.bodyType,
          fuelType: data.fuelType,
          year: data.year,
          
          // Valuation
          valuation: data.valuation,
          estimatedValue: data.valuation?.estimatedValue,
          
          // Running costs (check both formats)
          runningCosts: data.runningCosts || {
            fuelEconomy: {
              urban: data.urbanMpg || '',
              extraUrban: data.extraUrbanMpg || '',
              combined: data.combinedMpg || ''
            },
            annualTax: data.annualTax || '',
            co2Emissions: data.co2Emissions || '',
            insuranceGroup: data.insuranceGroup || ''
          },
          
          // MOT
          motStatus: data.motStatus,
          motDue: data.motDue || data.motExpiry
        };
        
        console.log(JSON.stringify(frontendFormat, null, 2));
        
      } else {
        console.log('❌ Enhanced lookup failed:', response.data.error);
      }
      
    } catch (apiError) {
      if (apiError.code === 'ECONNREFUSED') {
        console.log('❌ Backend server is not running!');
        console.log('💡 Start the backend server first:');
        console.log('   cd backend && npm start');
      } else {
        console.log('❌ API Error:', apiError.message);
        if (apiError.response) {
          console.log('   Status:', apiError.response.status);
          console.log('   Data:', apiError.response.data);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testVN73ETREnhancedEndpoint();