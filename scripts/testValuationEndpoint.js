/**
 * Test script for valuation endpoint
 * Tests the /api/vehicle-valuation/detailed endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testValuationEndpoint() {
  console.log('🧪 Testing Valuation Endpoint\n');
  console.log('='.repeat(60));

  // Test data
  const testVRM = 'BD51SMR'; // Contains 'A' for test mode
  const testMileage = 50000;

  try {
    console.log(`\n📋 Test Parameters:`);
    console.log(`   VRM: ${testVRM}`);
    console.log(`   Mileage: ${testMileage}`);
    console.log(`\n🔄 Calling: POST ${BASE_URL}/api/vehicle-valuation/detailed`);

    const response = await axios.post(
      `${BASE_URL}/api/vehicle-valuation/detailed`,
      {
        vrm: testVRM,
        mileage: testMileage,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('\n✅ SUCCESS! Response received:\n');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.isMockData) {
      console.log('\n⚠️  WARNING: Using mock data (API unavailable)');
    }

    if (response.data.data) {
      console.log('\n📊 Valuation Data:');
      const valuation = response.data.data.valuation;
      if (valuation?.estimatedValue) {
        console.log('   Retail:', `£${valuation.estimatedValue.retail?.toLocaleString()}`);
        console.log('   Private:', `£${valuation.estimatedValue.private?.toLocaleString()}`);
        console.log('   Trade:', `£${valuation.estimatedValue.trade?.toLocaleString()}`);
      }

      console.log('\n🚗 Vehicle Details:');
      const vehicle = response.data.data.vehicleDetails;
      if (vehicle) {
        console.log('   Make:', vehicle.make || 'N/A');
        console.log('   Model:', vehicle.model || 'N/A');
        console.log('   Colour:', vehicle.colour || 'N/A');
        console.log('   Fuel Type:', vehicle.fuelType || 'N/A');
        console.log('   Year:', vehicle.yearOfManufacture || 'N/A');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    return true;

  } catch (error) {
    console.log('\n❌ ERROR occurred:\n');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else if (error.request) {
      console.log('No response received from server');
      console.log('Is the backend running on port 5000?');
    } else {
      console.log('Error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('❌ Test failed!');
    return false;
  }
}

// Run the test
testValuationEndpoint()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
