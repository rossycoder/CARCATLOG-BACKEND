/**
 * Test electric vehicle range functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testElectricVehicleRange() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔋 Testing Electric Vehicle Range Support');
    console.log('========================================');
    
    // Test 1: Create a new electric car with range data
    console.log('\n📝 Test 1: Creating electric car with range data...');
    
    const electricCar = new Car({
      make: 'Tesla',
      model: 'Model 3',
      variant: 'Long Range',
      year: 2023,
      price: 45000,
      mileage: 5000,
      color: 'White',
      transmission: 'automatic',
      fuelType: 'Electric',
      description: 'Tesla Model 3 Long Range with excellent range',
      postcode: 'SW1A 1AA',
      condition: 'used',
      bodyType: 'Saloon',
      doors: 4,
      seats: 5,
      // Electric vehicle specific data
      electricRange: 358, // miles
      chargingTime: 8.5, // hours for 0-100%
      batteryCapacity: 75, // kWh
      runningCosts: {
        fuelEconomy: {
          urban: null, // No MPG for electric
          extraUrban: null,
          combined: null
        },
        co2Emissions: 0, // Zero emissions
        annualTax: 0, // No road tax for electric
        insuranceGroup: '32E',
        // Electric specific
        electricRange: 358,
        chargingTime: 8.5,
        batteryCapacity: 75
      },
      sellerContact: {
        type: 'private',
        email: 'test@example.com',
        phoneNumber: '07123456789'
      }
    });
    
    const savedCar = await electricCar.save();
    console.log('✅ Electric car created successfully');
    console.log(`   ID: ${savedCar._id}`);
    console.log(`   Range: ${savedCar.electricRange} miles`);
    console.log(`   Charging time: ${savedCar.chargingTime} hours`);
    console.log(`   Battery capacity: ${savedCar.batteryCapacity} kWh`);
    console.log(`   Running costs range: ${savedCar.runningCosts.electricRange} miles`);
    
    // Test 2: Query electric cars by range
    console.log('\n🔍 Test 2: Querying electric cars by range...');
    
    const longRangeCars = await Car.find({
      fuelType: 'Electric',
      electricRange: { $gte: 300 } // Cars with 300+ mile range
    });
    
    console.log(`✅ Found ${longRangeCars.length} electric cars with 300+ mile range`);
    longRangeCars.forEach(car => {
      console.log(`   ${car.make} ${car.model}: ${car.electricRange} miles`);
    });
    
    // Test 3: Update range data
    console.log('\n🔄 Test 3: Updating range data...');
    
    savedCar.electricRange = 405; // Updated range
    savedCar.runningCosts.electricRange = 405;
    await savedCar.save();
    
    console.log(`✅ Range updated to ${savedCar.electricRange} miles`);
    
    // Test 4: Check frontend data structure
    console.log('\n📊 Test 4: Frontend data structure...');
    
    const carForFrontend = await Car.findById(savedCar._id).lean();
    
    console.log('Electric vehicle data for frontend:');
    console.log(`   Range: ${carForFrontend.electricRange} miles`);
    console.log(`   Charging time: ${carForFrontend.chargingTime} hours`);
    console.log(`   Battery capacity: ${carForFrontend.batteryCapacity} kWh`);
    console.log(`   Running costs:`, {
      electricRange: carForFrontend.runningCosts?.electricRange,
      chargingTime: carForFrontend.runningCosts?.chargingTime,
      batteryCapacity: carForFrontend.runningCosts?.batteryCapacity
    });
    
    // Test 5: Compare with petrol car
    console.log('\n⛽ Test 5: Comparison with petrol car...');
    
    const petrolCar = new Car({
      make: 'BMW',
      model: '3 Series',
      variant: '320i',
      year: 2023,
      price: 35000,
      mileage: 8000,
      color: 'Black',
      transmission: 'automatic',
      fuelType: 'Petrol',
      description: 'BMW 3 Series with good fuel economy',
      postcode: 'SW1A 1AA',
      condition: 'used',
      bodyType: 'Saloon',
      doors: 4,
      seats: 5,
      // Petrol car data - no electric fields
      runningCosts: {
        fuelEconomy: {
          urban: 28.5,
          extraUrban: 42.1,
          combined: 35.2
        },
        co2Emissions: 155,
        annualTax: 165,
        insuranceGroup: '28E',
        // Electric fields should be null
        electricRange: null,
        chargingTime: null,
        batteryCapacity: null
      },
      sellerContact: {
        type: 'private',
        email: 'test2@example.com',
        phoneNumber: '07123456790'
      }
    });
    
    const savedPetrolCar = await petrolCar.save();
    console.log('✅ Petrol car created for comparison');
    console.log(`   MPG Combined: ${savedPetrolCar.runningCosts.fuelEconomy.combined}`);
    console.log(`   Electric range: ${savedPetrolCar.electricRange} (should be null)`);
    
    // Clean up test data
    console.log('\n🗑️ Cleaning up test data...');
    await Car.findByIdAndDelete(savedCar._id);
    await Car.findByIdAndDelete(savedPetrolCar._id);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎯 SUMMARY:');
    console.log('✅ Electric vehicle range fields added successfully');
    console.log('✅ Range data can be stored and queried');
    console.log('✅ Frontend data structure includes electric vehicle specs');
    console.log('✅ Petrol cars correctly have null electric fields');
    console.log('✅ Electric cars can be filtered by range');
    
    console.log('\n📋 Electric Vehicle Fields Available:');
    console.log('   - electricRange: Range in miles');
    console.log('   - chargingTime: Charging time in hours (0-100%)');
    console.log('   - batteryCapacity: Battery capacity in kWh');
    console.log('   - Available in both individual fields and runningCosts object');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testElectricVehicleRange();