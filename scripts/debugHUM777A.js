/**
 * Debug script for HUM777A vehicle data
 * Tests the complete data flow from API to frontend
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const enhancedVehicleService = require('../services/enhancedVehicleService');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const dataMerger = require('../utils/dataMerger');

const VRM = 'HUM777A';

async function debugVehicleData() {
  try {
    console.log('='.repeat(80));
    console.log('DEBUGGING VEHICLE DATA FOR:', VRM);
    console.log('='.repeat(80));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Test CheckCarDetails API directly
    console.log('\n' + '='.repeat(80));
    console.log('STEP 1: CheckCarDetails API Direct Call');
    console.log('='.repeat(80));
    
    const checkCarData = await CheckCarDetailsClient.getVehicleData(VRM);
    console.log('\nCheckCarDetails Raw Response:');
    console.log(JSON.stringify(checkCarData, null, 2));

    // Step 2: Test Enhanced Vehicle Service
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: Enhanced Vehicle Service (with data merger)');
    console.log('='.repeat(80));
    
    const enhancedData = await enhancedVehicleService.getEnhancedVehicleData(VRM, false);
    console.log('\nEnhanced Data (Merged):');
    console.log(JSON.stringify(enhancedData, null, 2));

    // Step 3: Check what the frontend would receive
    console.log('\n' + '='.repeat(80));
    console.log('STEP 3: Frontend Data Extraction');
    console.log('='.repeat(80));
    
    const extractValue = (field) => {
      if (field === null || field === undefined) return null;
      if (typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      return field;
    };

    console.log('\nExtracted Values (what frontend sees):');
    console.log('Make:', extractValue(enhancedData.make));
    console.log('Model:', extractValue(enhancedData.model));
    console.log('Year:', extractValue(enhancedData.year));
    console.log('Color:', extractValue(enhancedData.color));
    console.log('Fuel Type:', extractValue(enhancedData.fuelType));
    console.log('Transmission:', extractValue(enhancedData.transmission));
    console.log('Engine Size:', extractValue(enhancedData.engineSize));
    console.log('Body Type:', extractValue(enhancedData.bodyType));

    // Step 4: Check field sources
    console.log('\n' + '='.repeat(80));
    console.log('STEP 4: Data Sources');
    console.log('='.repeat(80));
    
    console.log('\nField Sources:');
    console.log(JSON.stringify(enhancedData.fieldSources, null, 2));

    console.log('\nData Sources:');
    console.log(JSON.stringify(enhancedData.dataSources, null, 2));

    // Step 5: Identify missing fields
    console.log('\n' + '='.repeat(80));
    console.log('STEP 5: Missing Fields Analysis');
    console.log('='.repeat(80));
    
    const missingFields = [];
    const fields = ['make', 'model', 'year', 'color', 'fuelType', 'transmission', 'engineSize', 'bodyType'];
    
    fields.forEach(field => {
      const value = extractValue(enhancedData[field]);
      if (!value || value === 'Unknown' || value === null) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      console.log('\n❌ Missing or Unknown Fields:');
      missingFields.forEach(field => {
        console.log(`  - ${field}: ${extractValue(enhancedData[field])}`);
      });
    } else {
      console.log('\n✅ All fields have valid data');
    }

    console.log('\n' + '='.repeat(80));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error during debug:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugVehicleData();
