/**
 * Clear cache for HUM777A and test with fresh data
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const enhancedVehicleService = require('../services/enhancedVehicleService');

const VRM = 'HUM777A';

async function clearAndTest() {
  try {
    console.log('='.repeat(80));
    console.log('CLEARING CACHE AND TESTING:', VRM);
    console.log('='.repeat(80));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear cache
    console.log('Clearing cache for', VRM, '...');
    const cleared = await enhancedVehicleService.clearCache(VRM);
    console.log(cleared ? '✅ Cache cleared' : '⚠️  No cache found to clear');

    // Get fresh data
    console.log('\nFetching fresh data...\n');
    const enhancedData = await enhancedVehicleService.getEnhancedVehicleData(VRM, false);
    
    // Extract values like the frontend does
    const extractValue = (field) => {
      if (field === null || field === undefined) return null;
      if (typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      return field;
    };

    console.log('\n' + '='.repeat(80));
    console.log('VEHICLE DETAILS (What User Sees):');
    console.log('='.repeat(80));
    console.log('Registration Number:', VRM);
    console.log('Mileage: 5,000 miles');
    console.log('Make:', extractValue(enhancedData.make));
    console.log('Model:', extractValue(enhancedData.model));
    console.log('Year:', extractValue(enhancedData.year));
    console.log('Color:', extractValue(enhancedData.color));
    console.log('Fuel Type:', extractValue(enhancedData.fuelType));
    console.log('Transmission:', extractValue(enhancedData.transmission));
    
    const engineSize = extractValue(enhancedData.engineSize);
    const engineSizeFormatted = engineSize ? `${(engineSize / 1000).toFixed(1)}L` : 'N/A';
    console.log('Engine Size:', engineSizeFormatted);
    
    console.log('Doors:', extractValue(enhancedData.doors));
    console.log('Body Type:', extractValue(enhancedData.bodyType));
    console.log('Previous Owners: 1');

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

clearAndTest();
