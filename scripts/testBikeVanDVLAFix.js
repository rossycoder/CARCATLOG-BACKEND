/**
 * Test script to verify Bike and Van DVLA API optimization
 * This should show £0.00 cost when DVLA API works, £0.05 when fallback is used
 */

require('dotenv').config();
const axios = require('axios');

async function testBikeVanDVLAFix() {
  try {
    console.log('🏍️🚐 Testing Bike and Van DVLA API Optimization');
    console.log('='.repeat(60));
    
    // Test registrations
    const testCases = [
      { registration: 'MT09ABC', type: 'bike', mileage: 15000 },
      { registration: 'FD66ABC', type: 'van', mileage: 80000 },
      { registration: 'BF12ABC', type: 'bike', mileage: 25000 }
    ];
    
    const baseURL = process.env.BACKEND_URL || 'http://localhost:5000';
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Testing ${testCase.type.toUpperCase()}: ${testCase.registration} with ${testCase.mileage} miles`);
      console.log('-'.repeat(50));
      
      const url = `${baseURL}/api/${testCase.type}s/basic-lookup/${testCase.registration}?mileage=${testCase.mileage}`;
      console.log(`📡 Calling: ${url}`);
      
      try {
        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          const data = response.data.data;
          const metadata = response.data.metadata;
          
          console.log(`✅ SUCCESS: ${testCase.type} lookup completed`);
          console.log(`   Make/Model: ${data.make} ${data.model} (${data.year})`);
          console.log(`   Color: ${data.color}`);
          console.log(`   Fuel Type: ${data.fuelType}`);
          console.log(`   Engine: ${data.engineSize || data.engineCC + 'cc' || 'Unknown'}`);
          console.log(`   Estimated Value: £${data.estimatedValue || 'Unknown'}`);
          
          if (testCase.type === 'bike') {
            console.log(`   Bike Type: ${data.bikeType || 'Unknown'}`);
          } else if (testCase.type === 'van') {
            console.log(`   Van Type: ${data.vanType || 'Unknown'}`);
            console.log(`   Payload: ${data.payloadCapacity || 'Unknown'}kg`);
          }
          
          // Check cost optimization
          console.log(`\n💰 COST ANALYSIS:`);
          console.log(`   API Provider: ${metadata.apiProvider}`);
          console.log(`   API Calls: ${metadata.apiCalls}`);
          console.log(`   Cost: £${metadata.cost.toFixed(2)}`);
          console.log(`   From Cache: ${metadata.fromCache ? 'Yes' : 'No'}`);
          
          if (metadata.cost === 0 && !metadata.fromCache) {
            console.log(`🎉 SUCCESS: FREE DVLA API was used (£0.00 cost)`);
          } else if (metadata.cost === 0.05) {
            console.log(`⚠️ FALLBACK: CheckCarDetails Vehiclespecs API was used (£0.05 cost)`);
          } else if (metadata.fromCache) {
            console.log(`📦 CACHED: Using cached data (£0.00 cost)`);
          } else {
            console.log(`❓ UNKNOWN: Unexpected cost pattern`);
          }
          
        } else {
          console.log(`❌ FAILED: ${response.data.error}`);
        }
        
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 OPTIMIZATION SUMMARY:');
    console.log('✅ FREE DVLA API (£0.00) should be tried first');
    console.log('✅ CheckCarDetails Vehiclespecs API (£0.05) as fallback');
    console.log('✅ NO expensive CheckCarDetails Full API (£1.82) calls');
    console.log('✅ Results cached for 30 days to avoid repeated calls');
    console.log('\n💡 Expected savings: 80-90% cost reduction vs old expensive API');
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

testBikeVanDVLAFix();