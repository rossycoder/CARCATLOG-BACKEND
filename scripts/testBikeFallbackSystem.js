/**
 * Test Bike Fallback System
 * Tests the bike controller's fallback mechanism when APIs fail
 */

const express = require('express');
const bikeController = require('../controllers/bikeController');

async function testBikeFallbackSystem() {
  console.log('🏍️ TESTING BIKE FALLBACK SYSTEM');
  console.log('==================================================');
  
  // Mock request and response objects
  const createMockReq = (registration, mileage) => ({
    params: { registration },
    query: { mileage }
  });
  
  const createMockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.data = data;
      return res;
    };
    return res;
  };
  
  // Test registrations
  const testRegistrations = [
    { reg: 'SD69UOY', mileage: 2500, description: 'User test registration' },
    { reg: 'AB12CDE', mileage: 5000, description: 'Mock test registration' },
    { reg: 'TEST123', mileage: 1000, description: 'Test registration' }
  ];
  
  for (const test of testRegistrations) {
    console.log(`\n📡 Testing: ${test.reg} (${test.description})`);
    console.log('--------------------------------------------------');
    
    try {
      const req = createMockReq(test.reg, test.mileage);
      const res = createMockRes();
      
      await bikeController.basicBikeLookup(req, res);
      
      if (res.data && res.data.success) {
        console.log('✅ Lookup successful!');
        console.log(`   Make: ${res.data.data.make || 'N/A'}`);
        console.log(`   Model: ${res.data.data.model || 'N/A'}`);
        console.log(`   Year: ${res.data.data.year || 'N/A'}`);
        console.log(`   Engine: ${res.data.data.engineSize || res.data.data.engineCC + 'cc' || 'N/A'}`);
        console.log(`   Bike Type: ${res.data.data.bikeType || 'N/A'}`);
        console.log(`   Estimated Value: £${res.data.data.estimatedValue || 'N/A'}`);
        
        // Check running costs
        console.log('\n💰 Running Costs Data:');
        console.log(`   Urban MPG: ${res.data.data.urbanMpg || 'N/A'}`);
        console.log(`   Extra Urban MPG: ${res.data.data.extraUrbanMpg || 'N/A'}`);
        console.log(`   Combined MPG: ${res.data.data.combinedMpg || 'N/A'}`);
        console.log(`   Annual Tax: £${res.data.data.annualTax || 'N/A'}`);
        console.log(`   Insurance Group: ${res.data.data.insuranceGroup || 'N/A'}`);
        console.log(`   CO2 Emissions: ${res.data.data.co2Emissions || 'N/A'}g/km`);
        
        console.log('\n📊 API Info:');
        console.log(`   API Provider: ${res.data.metadata?.apiProvider || 'N/A'}`);
        console.log(`   From Cache: ${res.data.metadata?.fromCache || false}`);
        console.log(`   API Calls: ${res.data.metadata?.apiCalls || 0}`);
        console.log(`   Cost: £${res.data.metadata?.cost || 0}`);
        
        if (res.data.metadata?.note) {
          console.log(`   Note: ${res.data.metadata.note}`);
        }
        
        // Check if running costs are available
        const hasRunningCosts = res.data.data.combinedMpg || res.data.data.urbanMpg || res.data.data.extraUrbanMpg || res.data.data.annualTax || res.data.data.insuranceGroup;
        if (hasRunningCosts) {
          console.log('✅ Running costs data available - auto-fill should work!');
        } else {
          console.log('⚠️ No running costs data - will need manual entry');
        }
        
      } else {
        console.log('❌ Lookup failed:', res.data?.error || 'Unknown error');
        console.log('   Status Code:', res.statusCode || 'N/A');
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('   ✅ Fallback system should provide mock data when APIs fail');
  console.log('   ✅ Running costs should be generated for auto-fill');
  console.log('   ✅ Frontend should receive valid bike data regardless of API status');
  console.log('   ✅ Users can still sell their bikes even when APIs are down');
}

// Run the test
testBikeFallbackSystem().catch(console.error);