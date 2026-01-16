/**
 * Test script for Enhanced Vehicle Lookup endpoint
 * Tests the /api/vehicles/enhanced-lookup/:registration endpoint
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_VRM = process.env.TEST_VRM || 'HUM777A';

async function testEnhancedLookup() {
  console.log('============================================================');
  console.log('Testing Enhanced Vehicle Lookup Endpoint');
  console.log('============================================================\n');

  console.log(`🚗 Testing with VRM: ${TEST_VRM}`);
  console.log('------------------------------------------------------------\n');

  try {
    // Test the enhanced lookup endpoint
    const response = await axios.get(
      `${API_BASE_URL}/api/vehicles/enhanced-lookup/${TEST_VRM}`,
      {
        timeout: 15000
      }
    );

    console.log('📊 RESPONSE DATA:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.success) {
      const data = response.data.data;
      const sources = data.dataSources || response.data.dataSources;
      const warnings = response.data.warnings;

      console.log('✅ SUCCESS! Extracted Data:');
      console.log('------------------------------------------------------------');
      
      // Extract values from source-tracked data
      const extractValue = (obj) => {
        if (obj && typeof obj === 'object' && 'value' in obj) {
          return obj.value;
        }
        return obj;
      };

      console.log(`Make: ${extractValue(data.make)}`);
      console.log(`Model: ${extractValue(data.model)}`);
      console.log(`Year: ${extractValue(data.year)}`);
      console.log(`Colour: ${extractValue(data.color)}`);
      console.log(`Fuel Type: ${extractValue(data.fuelType)}`);
      console.log(`Transmission: ${extractValue(data.transmission)}`);
      console.log('');

      // Display running costs if available
      if (data.runningCosts) {
        console.log('💰 Running Costs:');
        console.log('------------------------------------------------------------');
        const rc = data.runningCosts;
        if (rc.fuelEconomy) {
          console.log(`Urban MPG: ${extractValue(rc.fuelEconomy.urban) || 'N/A'}`);
          console.log(`Extra Urban MPG: ${extractValue(rc.fuelEconomy.extraUrban) || 'N/A'}`);
          console.log(`Combined MPG: ${extractValue(rc.fuelEconomy.combined) || 'N/A'}`);
        }
        console.log(`CO2 Emissions: ${extractValue(rc.co2Emissions) || 'N/A'} g/km`);
        console.log(`Insurance Group: ${extractValue(rc.insuranceGroup) || 'N/A'}`);
        console.log(`Annual Tax: £${extractValue(rc.annualTax) || 'N/A'}`);
        console.log('');
      }

      // Display performance data if available
      if (data.performance) {
        console.log('🏎️  Performance:');
        console.log('------------------------------------------------------------');
        const perf = data.performance;
        console.log(`Power: ${extractValue(perf.power) || 'N/A'} bhp`);
        console.log(`Torque: ${extractValue(perf.torque) || 'N/A'} Nm`);
        console.log(`0-60: ${extractValue(perf.acceleration) || 'N/A'} seconds`);
        console.log(`Top Speed: ${extractValue(perf.topSpeed) || 'N/A'} mph`);
        console.log('');
      }

      // Display valuation data if available
      if (data.valuation) {
        console.log('💵 Valuation:');
        console.log('------------------------------------------------------------');
        const val = data.valuation;
        console.log(`Dealer Price: £${extractValue(val.dealerPrice) || 'N/A'}`);
        console.log(`Private Price: £${extractValue(val.privatePrice) || 'N/A'}`);
        console.log(`Part Exchange: £${extractValue(val.partExchangePrice) || 'N/A'}`);
        console.log('');
      }

      // Display data sources
      console.log('📡 Data Sources:');
      console.log('------------------------------------------------------------');
      console.log(`DVLA: ${sources.dvla ? '✓' : '✗'}`);
      console.log(`CheckCarDetails: ${sources.checkCarDetails ? '✓' : '✗'}`);
      console.log('');

      // Display warnings if any
      if (warnings && warnings.length > 0) {
        console.log('⚠️  Warnings:');
        console.log('------------------------------------------------------------');
        warnings.forEach(warning => console.log(`- ${warning}`));
        console.log('');
      }

      console.log('✅ Test completed successfully!');
    } else {
      console.log('❌ FAILED! Response indicates failure');
      console.log('Error:', response.data.error);
    }

  } catch (error) {
    console.log('❌ ERROR during test:');
    console.log('------------------------------------------------------------');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received from server');
      console.log('Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the test
testEnhancedLookup();
