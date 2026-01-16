/**
 * Test enhanced vehicle service for HUM777A with new transformations
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const enhancedVehicleService = require('../services/enhancedVehicleService');

const VRM = 'HUM777A';

async function testEnhanced() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING ENHANCED VEHICLE SERVICE FOR:', VRM);
    console.log('='.repeat(80));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get enhanced data (bypass cache)
    const enhancedData = await enhancedVehicleService.getEnhancedVehicleData(VRM, false);
    
    console.log('\n' + '='.repeat(80));
    console.log('ENHANCED DATA (Full Response):');
    console.log('='.repeat(80));
    console.log(JSON.stringify(enhancedData, null, 2));

    // Extract values like the frontend does
    const extractValue = (field) => {
      if (field === null || field === undefined) return null;
      if (typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      return field;
    };

    console.log('\n' + '='.repeat(80));
    console.log('EXTRACTED VALUES (What Frontend Displays):');
    console.log('='.repeat(80));
    console.log('Registration:', VRM);
    console.log('Make:', extractValue(enhancedData.make));
    console.log('Model:', extractValue(enhancedData.model));
    console.log('Year:', extractValue(enhancedData.year));
    console.log('Color:', extractValue(enhancedData.color));
    console.log('Fuel Type:', extractValue(enhancedData.fuelType));
    console.log('Transmission:', extractValue(enhancedData.transmission));
    console.log('Engine Size:', extractValue(enhancedData.engineSize), 'cc');
    console.log('Body Type:', extractValue(enhancedData.bodyType));
    console.log('Doors:', extractValue(enhancedData.doors));
    console.log('Seats:', extractValue(enhancedData.seats));

    console.log('\n' + '='.repeat(80));
    console.log('DATA SOURCES:');
    console.log('='.repeat(80));
    console.log('DVLA:', enhancedData.dataSources.dvla ? '✅' : '❌');
    console.log('CheckCarDetails:', enhancedData.dataSources.checkCarDetails ? '✅' : '❌');
    console.log('Valuation:', enhancedData.dataSources.valuation ? '✅' : '❌');

    console.log('\n' + '='.repeat(80));
    console.log('FIELD SOURCES:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(enhancedData.fieldSources, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testEnhanced();
