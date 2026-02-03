/**
 * Test script to verify running costs data flow from API to frontend
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const VehicleHistory = require('../models/VehicleHistory');

async function testRunningCostsFlow() {
  try {
    console.log('🧪 Testing running costs data flow...\n');
    
    // Find the EK11XHZ vehicle history record
    const vehicleHistory = await VehicleHistory.findOne({ vrm: 'EK11XHZ' });
    
    if (!vehicleHistory) {
      console.log('❌ No vehicle history found for EK11XHZ');
      return;
    }
    
    console.log('📋 Vehicle History Record:');
    console.log('   VRM:', vehicleHistory.vrm);
    console.log('   Mileage:', vehicleHistory.mileage);
    console.log('   Urban MPG:', vehicleHistory.urbanMpg);
    console.log('   Extra Urban MPG:', vehicleHistory.extraUrbanMpg);
    console.log('   Combined MPG:', vehicleHistory.combinedMpg);
    console.log('   Annual Tax:', vehicleHistory.annualTax);
    console.log('   CO2 Emissions:', vehicleHistory.co2Emissions);
    console.log('   Insurance Group:', vehicleHistory.insuranceGroup);
    
    // Simulate the enhanced vehicle service response structure
    const simulatedResponse = {
      runningCosts: {
        fuelEconomy: {
          urban: { value: vehicleHistory.urbanMpg, source: 'cached' },
          extraUrban: { value: vehicleHistory.extraUrbanMpg, source: 'cached' },
          combined: { value: vehicleHistory.combinedMpg, source: 'cached' }
        },
        co2Emissions: { value: vehicleHistory.co2Emissions, source: 'cached' },
        annualTax: { value: vehicleHistory.annualTax, source: 'cached' },
        insuranceGroup: { value: vehicleHistory.insuranceGroup, source: 'cached' }
      }
    };
    
    console.log('\n📤 Simulated API Response Structure:');
    console.log(JSON.stringify(simulatedResponse, null, 2));
    
    // Simulate the extractValues function from useEnhancedVehicleLookup
    const extractValues = (obj) => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      
      // If this is a {value, source} object, extract the value
      if (obj.value !== undefined && obj.source !== undefined) {
        return obj.value;
      }
      
      // Recursively extract values from nested objects
      const result = {};
      Object.keys(obj).forEach(key => {
        result[key] = extractValues(obj[key]);
      });
      return result;
    };
    
    const extractedRunningCosts = extractValues(simulatedResponse.runningCosts);
    
    console.log('\n🔄 After extractValues processing:');
    console.log(JSON.stringify(extractedRunningCosts, null, 2));
    
    // Simulate the frontend processing
    const frontendRunningCosts = {
      fuelEconomy: {
        urban: String(extractedRunningCosts?.fuelEconomy?.urban || ''),
        extraUrban: String(extractedRunningCosts?.fuelEconomy?.extraUrban || ''),
        combined: String(extractedRunningCosts?.fuelEconomy?.combined || '')
      },
      annualTax: String(extractedRunningCosts?.annualTax || ''),
      insuranceGroup: String(extractedRunningCosts?.insuranceGroup || ''),
      co2Emissions: String(extractedRunningCosts?.co2Emissions || '')
    };
    
    console.log('\n🎯 Final frontend form values:');
    console.log(JSON.stringify(frontendRunningCosts, null, 2));
    
    console.log('\n✅ Running costs data flow test completed!');
    
  } catch (error) {
    console.error('❌ Error testing running costs flow:', error);
  } finally {
    mongoose.disconnect();
  }
}

testRunningCostsFlow();