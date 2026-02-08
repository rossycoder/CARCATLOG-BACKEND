/**
 * Test the FIXED basicVehicleLookup endpoint
 * Should use cache and NOT call expensive APIs
 */

require('dotenv').config();
const axios = require('axios');

async function testBasicLookupFixed() {
  try {
    console.log('🔍 Testing FIXED Basic Lookup Endpoint');
    console.log('='.repeat(60));
    
    const registration = 'YD17AVU';
    const mileage = 2500;
    
    console.log(`\n📋 Test Vehicle: ${registration}`);
    console.log(`📏 Mileage: ${mileage}\n`);
    
    const baseURL = 'http://localhost:5000';
    const url = `${baseURL}/api/vehicles/basic-lookup/${registration}?mileage=${mileage}`;
    
    console.log(`🌐 Calling: ${url}\n`);
    
    // First call - should fetch from API or cache
    console.log('📞 FIRST CALL:');
    const response1 = await axios.get(url);
    
    console.log('\n✅ Response 1:');
    console.log(`   From Cache: ${response1.data.fromCache}`);
    console.log(`   API Calls: ${response1.data.apiCalls}`);
    console.log(`   Cost: £${response1.data.cost}`);
    console.log(`   Vehicle: ${response1.data.data.make} ${response1.data.data.model}`);
    
    // Second call - should ALWAYS use cache (NO API CALL)
    console.log('\n📞 SECOND CALL (should be from cache):');
    const response2 = await axios.get(url);
    
    console.log('\n✅ Response 2:');
    console.log(`   From Cache: ${response2.data.fromCache}`);
    console.log(`   API Calls: ${response2.data.apiCalls}`);
    console.log(`   Cost: £${response2.data.cost}`);
    console.log(`   Vehicle: ${response2.data.data.make} ${response2.data.data.model}`);
    
    // Verify fix
    console.log('\n' + '='.repeat(60));
    if (response2.data.fromCache && response2.data.apiCalls === 0 && response2.data.cost === 0) {
      console.log('✅ FIX VERIFIED: Second call used cache (NO API CALL)');
    } else {
      console.log('❌ FIX FAILED: Second call still making API calls!');
    }
    
    // Check data structure
    console.log('\n📊 Data Structure Check:');
    const data = response2.data.data;
    console.log(`   Make: ${data.make}`);
    console.log(`   Model: ${data.model}`);
    console.log(`   Year: ${data.year}`);
    console.log(`   Fuel: ${data.fuelType}`);
    console.log(`   Transmission: ${data.transmission}`);
    console.log(`   Body Type: ${data.bodyType}`);
    console.log(`   Engine Size: ${data.engineSize}`);
    console.log(`   Color: ${data.color}`);
    console.log(`   Estimated Value: £${data.estimatedValue}`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testBasicLookupFixed();
