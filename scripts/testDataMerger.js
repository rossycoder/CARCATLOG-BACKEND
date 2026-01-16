/**
 * Test script for Data Merger utility
 * Tests merging of DVLA and CheckCarDetails data
 */

const dataMerger = require('../utils/dataMerger');

// Mock DVLA data
const mockDvlaData = {
  make: 'BMW',
  model: '3 Series',
  year: 2020,
  color: 'Black',
  fuelType: 'Diesel',
  transmission: 'Automatic',
  engineSize: 1995,
  co2Emissions: 130,
  annualTax: 160
};

// Mock CheckCarDetails data
const mockCheckCarData = {
  make: 'BMW',
  model: '320d',
  year: 2020,
  fuelType: 'Diesel',
  transmission: 'Automatic',
  engineSize: 1995,
  fuelEconomy: {
    urban: 35.5,
    extraUrban: 55.2,
    combined: 45.8
  },
  co2Emissions: 125,
  insuranceGroup: '25E',
  annualTax: 150,
  performance: {
    power: 184,
    torque: 290,
    acceleration: 7.1,
    topSpeed: 146
  }
};

console.log('🧪 Testing Data Merger Utility\n');

// Test 1: Merge with both APIs providing data
console.log('=== Test 1: Both APIs provide data ===');
const merged1 = dataMerger.merge(mockDvlaData, mockCheckCarData);
console.log('Basic info (DVLA priority):');
console.log(`  Make: ${merged1.make.value} (source: ${merged1.make.source})`);
console.log(`  Model: ${merged1.model.value} (source: ${merged1.model.source})`);
console.log(`  Year: ${merged1.year.value} (source: ${merged1.year.source})`);

console.log('\nRunning costs (CheckCarDetails priority):');
console.log(`  Urban MPG: ${merged1.runningCosts.fuelEconomy.urban.value} (source: ${merged1.runningCosts.fuelEconomy.urban.source})`);
console.log(`  Combined MPG: ${merged1.runningCosts.fuelEconomy.combined.value} (source: ${merged1.runningCosts.fuelEconomy.combined.source})`);
console.log(`  CO2: ${merged1.runningCosts.co2Emissions.value} g/km (source: ${merged1.runningCosts.co2Emissions.source})`);
console.log(`  Insurance: ${merged1.runningCosts.insuranceGroup.value} (source: ${merged1.runningCosts.insuranceGroup.source})`);
console.log(`  Tax: £${merged1.runningCosts.annualTax.value} (source: ${merged1.runningCosts.annualTax.source})`);

console.log('\nPerformance (CheckCarDetails only):');
console.log(`  Power: ${merged1.performance.power.value} bhp (source: ${merged1.performance.power.source})`);
console.log(`  Torque: ${merged1.performance.torque.value} Nm (source: ${merged1.performance.torque.source})`);
console.log(`  0-60: ${merged1.performance.acceleration.value}s (source: ${merged1.performance.acceleration.source})`);
console.log(`  Top Speed: ${merged1.performance.topSpeed.value} mph (source: ${merged1.performance.topSpeed.source})`);

console.log('\nData sources:', merged1.dataSources);

// Test 2: Only DVLA data available
console.log('\n=== Test 2: Only DVLA data available ===');
const merged2 = dataMerger.merge(mockDvlaData, null);
console.log(`Make: ${merged2.make.value} (source: ${merged2.make.source})`);
console.log(`Model: ${merged2.model.value} (source: ${merged2.model.source})`);
console.log(`Fuel Economy: ${merged2.runningCosts.fuelEconomy.combined.value} (source: ${merged2.runningCosts.fuelEconomy.combined.source})`);
console.log(`Performance Power: ${merged2.performance.power.value} (source: ${merged2.performance.power.source})`);
console.log('Data sources:', merged2.dataSources);

// Test 3: Only CheckCarDetails data available
console.log('\n=== Test 3: Only CheckCarDetails data available ===');
const merged3 = dataMerger.merge(null, mockCheckCarData);
console.log(`Make: ${merged3.make.value} (source: ${merged3.make.source})`);
console.log(`Model: ${merged3.model.value} (source: ${merged3.model.source})`);
console.log(`Fuel Economy: ${merged3.runningCosts.fuelEconomy.combined.value} (source: ${merged3.runningCosts.fuelEconomy.combined.source})`);
console.log(`Performance Power: ${merged3.performance.power.value} (source: ${merged3.performance.power.source})`);
console.log('Data sources:', merged3.dataSources);

// Test 4: Partial data from both APIs
console.log('\n=== Test 4: Partial data from both APIs ===');
const partialDvla = { make: 'Ford', model: 'Focus', year: 2019 };
const partialCheckCar = { fuelEconomy: { combined: 50.2 }, co2Emissions: 110 };
const merged4 = dataMerger.merge(partialDvla, partialCheckCar);
console.log(`Make: ${merged4.make.value} (source: ${merged4.make.source})`);
console.log(`Model: ${merged4.model.value} (source: ${merged4.model.source})`);
console.log(`Fuel Economy: ${merged4.runningCosts.fuelEconomy.combined.value} (source: ${merged4.runningCosts.fuelEconomy.combined.source})`);
console.log(`CO2: ${merged4.runningCosts.co2Emissions.value} (source: ${merged4.runningCosts.co2Emissions.source})`);

console.log('\n✅ Data Merger tests completed!');
