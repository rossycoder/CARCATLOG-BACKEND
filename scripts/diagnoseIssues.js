/**
 * Diagnostic script to test:
 * 1. Vehicle History API
 * 2. Filter Options endpoint
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

async function testHistoryAPI() {
  console.log('\n=== Testing Vehicle History API ===');
  
  try {
    const historyService = new HistoryService();
    const testVRM = 'AB12CDE'; // Test VRM
    
    console.log(`Testing with VRM: ${testVRM}`);
    console.log(`API Environment: ${process.env.API_ENVIRONMENT}`);
    console.log(`API Base URL: ${process.env.HISTORY_API_BASE_URL}`);
    
    const result = await historyService.checkVehicleHistory(testVRM, true);
    console.log('✓ History API call successful');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('✗ History API call failed');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testFilterOptions() {
  console.log('\n=== Testing Filter Options ===');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Count total cars
    const totalCars = await Car.countDocuments();
    console.log(`Total cars in database: ${totalCars}`);
    
    // Count active cars
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`Active cars: ${activeCars}`);
    
    // Get sample car to check fields
    const sampleCar = await Car.findOne();
    if (sampleCar) {
      console.log('\nSample car fields:');
      console.log('- make:', sampleCar.make);
      console.log('- model:', sampleCar.model);
      console.log('- color:', sampleCar.color);
      console.log('- fuelType:', sampleCar.fuelType);
      console.log('- transmission:', sampleCar.transmission);
      console.log('- bodyType:', sampleCar.bodyType);
      console.log('- advertStatus:', sampleCar.advertStatus);
    }
    
    // Get distinct values
    console.log('\n--- Distinct Values (all cars) ---');
    const allMakes = await Car.distinct('make');
    const allModels = await Car.distinct('model');
    const allColors = await Car.distinct('color');
    const allFuelTypes = await Car.distinct('fuelType');
    const allTransmissions = await Car.distinct('transmission');
    const allBodyTypes = await Car.distinct('bodyType');
    
    console.log(`Makes (all): ${allMakes.length}`, allMakes.slice(0, 5));
    console.log(`Models (all): ${allModels.length}`, allModels.slice(0, 5));
    console.log(`Colors (all): ${allColors.length}`, allColors);
    console.log(`Fuel Types (all): ${allFuelTypes.length}`, allFuelTypes);
    console.log(`Transmissions (all): ${allTransmissions.length}`, allTransmissions);
    console.log(`Body Types (all): ${allBodyTypes.length}`, allBodyTypes);
    
    console.log('\n--- Distinct Values (active cars only) ---');
    const activeMakes = await Car.distinct('make', { advertStatus: 'active' });
    const activeModels = await Car.distinct('model', { advertStatus: 'active' });
    const activeColors = await Car.distinct('color', { advertStatus: 'active' });
    const activeFuelTypes = await Car.distinct('fuelType', { advertStatus: 'active' });
    const activeTransmissions = await Car.distinct('transmission', { advertStatus: 'active' });
    const activeBodyTypes = await Car.distinct('bodyType', { advertStatus: 'active' });
    
    console.log(`Makes (active): ${activeMakes.length}`, activeMakes.slice(0, 5));
    console.log(`Models (active): ${activeModels.length}`, activeModels.slice(0, 5));
    console.log(`Colors (active): ${activeColors.length}`, activeColors);
    console.log(`Fuel Types (active): ${activeFuelTypes.length}`, activeFuelTypes);
    console.log(`Transmissions (active): ${activeTransmissions.length}`, activeTransmissions);
    console.log(`Body Types (active): ${activeBodyTypes.length}`, activeBodyTypes);
    
    // Check for null/undefined values
    console.log('\n--- Checking for null/undefined values ---');
    const carsWithoutMake = await Car.countDocuments({ $or: [{ make: null }, { make: '' }, { make: { $exists: false } }] });
    const carsWithoutColor = await Car.countDocuments({ $or: [{ color: null }, { color: '' }, { color: { $exists: false } }] });
    const carsWithoutStatus = await Car.countDocuments({ $or: [{ advertStatus: null }, { advertStatus: '' }, { advertStatus: { $exists: false } }] });
    
    console.log(`Cars without make: ${carsWithoutMake}`);
    console.log(`Cars without color: ${carsWithoutColor}`);
    console.log(`Cars without advertStatus: ${carsWithoutStatus}`);
    
  } catch (error) {
    console.error('✗ Filter options test failed');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

async function main() {
  console.log('=== Diagnostic Script ===');
  console.log('Testing Vehicle History API and Filter Options\n');
  
  // Test History API
  await testHistoryAPI();
  
  // Test Filter Options
  await testFilterOptions();
  
  console.log('\n=== Diagnostic Complete ===');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
