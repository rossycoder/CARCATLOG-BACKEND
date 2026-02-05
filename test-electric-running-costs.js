/**
 * Test electric vehicle running costs issue
 */

require('dotenv').config();
const enhancedVehicleService = require('./services/enhancedVehicleService');

async function testElectricRunningCosts() {
  try {
    console.log('🔋 Testing Electric Vehicle Running Costs Issue');
    console.log('===============================================');
    
    const registration = 'BG22UCP';
    
    console.log(`\n📋 Testing registration: ${registration}`);
    
    // Clear cache first to test fresh API call
    await enhancedVehicleService.clearCache(registration);
    console.log('🗑️ Cache cleared');
    
    // Test enhanced vehicle lookup (what the frontend uses)
    console.log('\n🔍 Testing enhanced vehicle lookup...');
    const result = await enhancedVehicleService.getEnhancedVehicleData(registration, true, 2500);
    
    console.log('\n📊 RESULT ANALYSIS:');
    console.log('Success:', !!result);
    console.log('Make:', result.make?.value || result.make);
    console.log('Model:', result.model?.value || result.model);
    console.log('FuelType:', result.fuelType?.value || result.fuelType);
    console.log('EngineSize:', result.engineSize?.value || result.engineSize);
    
    console.log('\n🏃‍♂️ RUNNING COSTS:');
    if (result.runningCosts) {
      console.log('Urban MPG:', result.runningCosts.fuelEconomy?.urban);
      console.log('Extra Urban MPG:', result.runningCosts.fuelEconomy?.extraUrban);
      console.log('Combined MPG:', result.runningCosts.fuelEconomy?.combined);
      console.log('Annual Tax:', result.runningCosts.annualTax);
      console.log('CO2 Emissions:', result.runningCosts.co2Emissions);
      console.log('Insurance Group:', result.runningCosts.insuranceGroup);
    } else {
      console.log('❌ No running costs object found');
    }
    
    console.log('\n🔄 Testing cache hit...');
    const cachedResult = await enhancedVehicleService.getEnhancedVehicleData(registration, true, 2500);
    console.log('Cache hit successful:', !!cachedResult);
    
    if (cachedResult) {
      console.log('Cached Make:', cachedResult.make?.value || cachedResult.make);
      console.log('Cached Model:', cachedResult.model?.value || cachedResult.model);
      console.log('Cached EngineSize:', cachedResult.engineSize?.value || cachedResult.engineSize);
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testElectricRunningCosts();