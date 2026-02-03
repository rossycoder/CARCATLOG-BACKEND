require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testEnhancedDataRunningCosts() {
  try {
    console.log('🔍 TESTING ENHANCED DATA RUNNING COSTS');
    console.log('=====================================');
    
    const baseUrl = 'http://localhost:5000';
    const vrm = 'VN73ETR';
    const mileage = 2500;
    
    console.log(`📡 Calling: ${baseUrl}/api/vehicles/enhanced-lookup/${vrm}?mileage=${mileage}`);
    
    const response = await axios.get(`${baseUrl}/api/vehicles/enhanced-lookup/${vrm}?mileage=${mileage}`);
    
    if (response.data.success) {
      const data = response.data.data;
      
      console.log('\n📊 RAW ENHANCED DATA:');
      console.log('====================');
      console.log('Full data keys:', Object.keys(data));
      
      console.log('\n🏃 RUNNING COSTS ANALYSIS:');
      console.log('==========================');
      console.log('Has runningCosts?', !!data.runningCosts);
      console.log('runningCosts type:', typeof data.runningCosts);
      console.log('runningCosts value:', data.runningCosts);
      
      if (data.runningCosts) {
        console.log('\n🔍 RUNNING COSTS BREAKDOWN:');
        console.log('fuelEconomy:', data.runningCosts.fuelEconomy);
        console.log('annualTax:', data.runningCosts.annualTax);
        console.log('co2Emissions:', data.runningCosts.co2Emissions);
        console.log('insuranceGroup:', data.runningCosts.insuranceGroup);
      }
      
      console.log('\n🔧 MOT DATA ANALYSIS:');
      console.log('=====================');
      console.log('Has motStatus?', !!data.motStatus);
      console.log('motStatus:', data.motStatus);
      console.log('Has motDue?', !!data.motDue);
      console.log('motDue:', data.motDue);
      console.log('Has motExpiry?', !!data.motExpiry);
      console.log('motExpiry:', data.motExpiry);
      console.log('year:', data.year);
      
      console.log('\n💡 FRONTEND SIMULATION:');
      console.log('=======================');
      
      // Simulate the exact check from CarAdvertEditPage
      if (data.runningCosts) {
        console.log('✅ Running costs condition PASSED - should update frontend');
        
        const newRunningCosts = {
          fuelEconomy: {
            urban: String(data.runningCosts.fuelEconomy?.urban || ''),
            extraUrban: String(data.runningCosts.fuelEconomy?.extraUrban || ''),
            combined: String(data.runningCosts.fuelEconomy?.combined || '')
          },
          annualTax: String(data.runningCosts.annualTax || ''),
          insuranceGroup: String(data.runningCosts.insuranceGroup || ''),
          co2Emissions: String(data.runningCosts.co2Emissions || '')
        };
        
        console.log('Frontend running costs object:', JSON.stringify(newRunningCosts, null, 2));
      } else {
        console.log('❌ Running costs condition FAILED - frontend will not update');
      }
      
      // Check MOT data for new car calculation
      if (data.year >= 2020) {
        const motDueYear = data.year + 3;
        const motDueDate = `${motDueYear}-10-31`;
        console.log(`🔧 Calculated MOT due for new car (${data.year}): ${motDueDate}`);
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

testEnhancedDataRunningCosts();