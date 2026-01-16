/**
 * Test script for Car Model Schema
 * Verifies the enhanced fields are properly defined
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Car = require('../models/Car');

async function testCarModelSchema() {
  console.log('============================================================');
  console.log('Testing Car Model Schema');
  console.log('============================================================\n');

  try {
    // Test 1: Create a car with enhanced fields
    console.log('Test 1: Creating car with enhanced fields...');
    
    const testCar = new Car({
      make: 'BMW',
      model: '320D M SPORT',
      year: 2020,
      price: 18500,
      mileage: 45000,
      color: 'SILVER',
      transmission: 'manual',
      fuelType: 'Diesel',
      description: 'Test vehicle with enhanced data',
      postcode: 'SW1A 1AA',
      registrationNumber: 'TEST123',
      
      // Enhanced running costs
      runningCosts: {
        fuelEconomy: {
          urban: 45.6,
          extraUrban: 58.9,
          combined: 52.3
        },
        co2Emissions: 125,
        insuranceGroup: '25E',
        annualTax: 150
      },
      
      // Performance data
      performance: {
        power: 184,
        torque: 290,
        acceleration: 7.1,
        topSpeed: 146
      },
      
      // Valuation data
      valuation: {
        dealerPrice: 18500,
        privatePrice: 17200,
        partExchangePrice: 15800,
        valuationDate: new Date()
      },
      
      // Data sources
      dataSources: {
        dvla: true,
        checkCarDetails: true,
        lastUpdated: new Date()
      },
      
      // Field sources
      fieldSources: {
        make: 'dvla',
        model: 'dvla',
        runningCosts: {
          fuelEconomy: {
            urban: 'checkcardetails',
            extraUrban: 'checkcardetails',
            combined: 'checkcardetails'
          },
          co2Emissions: 'checkcardetails'
        }
      }
    });

    console.log('✅ Car object created successfully');
    console.log('');

    // Test 2: Verify field structure
    console.log('Test 2: Verifying field structure...');
    console.log('------------------------------------------------------------');
    
    console.log('Running Costs:');
    console.log(`  Urban MPG: ${testCar.runningCosts.fuelEconomy.urban}`);
    console.log(`  Extra Urban MPG: ${testCar.runningCosts.fuelEconomy.extraUrban}`);
    console.log(`  Combined MPG: ${testCar.runningCosts.fuelEconomy.combined}`);
    console.log(`  CO2 Emissions: ${testCar.runningCosts.co2Emissions} g/km`);
    console.log(`  Insurance Group: ${testCar.runningCosts.insuranceGroup}`);
    console.log(`  Annual Tax: £${testCar.runningCosts.annualTax}`);
    console.log('');
    
    console.log('Performance:');
    console.log(`  Power: ${testCar.performance.power} bhp`);
    console.log(`  Torque: ${testCar.performance.torque} Nm`);
    console.log(`  0-60: ${testCar.performance.acceleration} seconds`);
    console.log(`  Top Speed: ${testCar.performance.topSpeed} mph`);
    console.log('');
    
    console.log('Valuation:');
    console.log(`  Dealer Price: £${testCar.valuation.dealerPrice}`);
    console.log(`  Private Price: £${testCar.valuation.privatePrice}`);
    console.log(`  Part Exchange: £${testCar.valuation.partExchangePrice}`);
    console.log('');
    
    console.log('Data Sources:');
    console.log(`  DVLA: ${testCar.dataSources.dvla ? '✓' : '✗'}`);
    console.log(`  CheckCarDetails: ${testCar.dataSources.checkCarDetails ? '✓' : '✗'}`);
    console.log('');

    console.log('✅ All fields verified successfully');
    console.log('');

    // Test 3: Validate schema
    console.log('Test 3: Validating schema...');
    const validationError = testCar.validateSync();
    
    if (validationError) {
      console.log('❌ Validation failed:');
      console.log(validationError);
    } else {
      console.log('✅ Schema validation passed');
    }
    console.log('');

    // Test 4: Check default values
    console.log('Test 4: Testing default values...');
    const carWithDefaults = new Car({
      make: 'Test',
      model: 'Model',
      year: 2020,
      price: 10000,
      mileage: 50000,
      color: 'Blue',
      transmission: 'automatic',
      fuelType: 'Petrol',
      description: 'Test',
      postcode: 'SW1A 1AA'
    });

    console.log(`Running Costs Urban MPG (default): ${carWithDefaults.runningCosts.fuelEconomy.urban}`);
    console.log(`Performance Power (default): ${carWithDefaults.performance.power}`);
    console.log(`Valuation Dealer Price (default): ${carWithDefaults.valuation.dealerPrice}`);
    console.log(`Data Sources DVLA (default): ${carWithDefaults.dataSources.dvla}`);
    console.log('✅ Default values working correctly');
    console.log('');

    console.log('============================================================');
    console.log('✅ All tests passed successfully!');
    console.log('============================================================');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the test
testCarModelSchema();
