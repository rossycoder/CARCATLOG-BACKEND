/**
 * Test script for enhanced vehicle data fixes
 * Tests the complete flow: API calls -> data merging -> value extraction
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function testEnhancedVehicleData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test registration number
    const testReg = 'HUM777A';
    
    console.log(`🚗 Testing enhanced vehicle lookup for: ${testReg}\n`);
    console.log('=' .repeat(80));
    
    // Get enhanced vehicle data
    const result = await enhancedVehicleService.getVehicleDataWithFallback(testReg);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS:');
    console.log('='.repeat(80));
    
    if (result.success) {
      console.log('\n✅ Lookup successful!\n');
      
      // Check data sources
      console.log('📡 Data Sources:');
      console.log(`  - DVLA: ${result.data.dataSources.dvla ? '✅' : '❌'}`);
      console.log(`  - CheckCarDetails: ${result.data.dataSources.checkCarDetails ? '✅' : '❌'}`);
      console.log(`  - Valuation: ${result.data.dataSources.valuation ? '✅' : '❌'}`);
      
      // Check basic vehicle info
      console.log('\n🚙 Basic Vehicle Info:');
      console.log(`  - Make: ${result.data.make?.value || 'N/A'} (source: ${result.data.make?.source || 'N/A'})`);
      console.log(`  - Model: ${result.data.model?.value || 'N/A'} (source: ${result.data.model?.source || 'N/A'})`);
      console.log(`  - Year: ${result.data.year?.value || 'N/A'} (source: ${result.data.year?.source || 'N/A'})`);
      console.log(`  - Color: ${result.data.color?.value || 'N/A'} (source: ${result.data.color?.source || 'N/A'})`);
      console.log(`  - Fuel Type: ${result.data.fuelType?.value || 'N/A'} (source: ${result.data.fuelType?.source || 'N/A'})`);
      console.log(`  - Transmission: ${result.data.transmission?.value || 'N/A'} (source: ${result.data.transmission?.source || 'N/A'})`);
      
      // Check running costs
      console.log('\n💰 Running Costs:');
      if (result.data.runningCosts) {
        console.log('  Fuel Economy:');
        console.log(`    - Urban: ${result.data.runningCosts.fuelEconomy?.urban?.value || 'N/A'} mpg (source: ${result.data.runningCosts.fuelEconomy?.urban?.source || 'N/A'})`);
        console.log(`    - Extra Urban: ${result.data.runningCosts.fuelEconomy?.extraUrban?.value || 'N/A'} mpg (source: ${result.data.runningCosts.fuelEconomy?.extraUrban?.source || 'N/A'})`);
        console.log(`    - Combined: ${result.data.runningCosts.fuelEconomy?.combined?.value || 'N/A'} mpg (source: ${result.data.runningCosts.fuelEconomy?.combined?.source || 'N/A'})`);
        console.log(`  - Annual Tax: £${result.data.runningCosts.annualTax?.value || 'N/A'} (source: ${result.data.runningCosts.annualTax?.source || 'N/A'})`);
        console.log(`  - Insurance Group: ${result.data.runningCosts.insuranceGroup?.value || 'N/A'} (source: ${result.data.runningCosts.insuranceGroup?.source || 'N/A'})`);
        console.log(`  - CO2 Emissions: ${result.data.runningCosts.co2Emissions?.value || 'N/A'} g/km (source: ${result.data.runningCosts.co2Emissions?.source || 'N/A'})`);
      } else {
        console.log('  ❌ No running costs data available');
      }
      
      // Check warnings
      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.log(`  - ${warning}`);
        });
      }
      
      // Test value extraction (simulating frontend)
      console.log('\n🔧 Testing Value Extraction (Frontend Simulation):');
      const extractValues = (data) => {
        const extract = (obj) => {
          if (obj === null || obj === undefined) return null;
          if (typeof obj !== 'object') return obj;
          if (obj.value !== undefined && obj.source !== undefined) {
            return obj.value;
          }
          const result = {};
          Object.keys(obj).forEach(key => {
            result[key] = extract(obj[key]);
          });
          return result;
        };
        return extract(data);
      };
      
      const extractedData = extractValues(result.data);
      console.log('  Extracted Running Costs:');
      console.log(`    - Urban MPG: ${extractedData.runningCosts?.fuelEconomy?.urban || 'N/A'}`);
      console.log(`    - Extra Urban MPG: ${extractedData.runningCosts?.fuelEconomy?.extraUrban || 'N/A'}`);
      console.log(`    - Combined MPG: ${extractedData.runningCosts?.fuelEconomy?.combined || 'N/A'}`);
      console.log(`    - Annual Tax: ${extractedData.runningCosts?.annualTax || 'N/A'}`);
      console.log(`    - Insurance Group: ${extractedData.runningCosts?.insuranceGroup || 'N/A'}`);
      console.log(`    - CO2 Emissions: ${extractedData.runningCosts?.co2Emissions || 'N/A'}`);
      
    } else {
      console.log('\n❌ Lookup failed!');
      console.log(`Error: ${result.error}`);
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the test
testEnhancedVehicleData();
