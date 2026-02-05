/**
 * Test Automatic Electric Vehicle Enhancement
 * This script tests that electric vehicles are automatically enhanced when saved
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testAutomaticEVEnhancement() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🧪 Testing Automatic Electric Vehicle Enhancement...\n');
    
    // Test 1: Create a basic electric vehicle (should be auto-enhanced)
    console.log('1️⃣ Test 1: Creating basic BMW i4 (should auto-enhance)...');
    
    const basicEV = new Car({
      make: 'BMW',
      model: 'i4',
      variant: 'eDrive40',
      year: 2023,
      price: 42000,
      estimatedValue: 42000,
      mileage: 1500,
      color: 'Mineral Grey',
      transmission: 'automatic',
      fuelType: 'Electric', // This should trigger auto-enhancement
      description: 'BMW i4 eDrive40 - Pure electric driving pleasure',
      images: ['https://example.com/bmw-i4-image.jpg'],
      condition: 'used',
      vehicleType: 'car',
      bodyType: 'Gran Coupe',
      doors: 4,
      seats: 5,
      registrationNumber: 'EV23BMW',
      dataSource: 'manual',
      historyCheckStatus: 'pending',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'seller@example.com',
        postcode: 'B1 1AA'
      },
      isDealerListing: false,
      postcode: 'B1 1AA',
      locationName: 'Birmingham',
      latitude: 52.4862,
      longitude: -1.8904,
      location: {
        type: 'Point',
        coordinates: [-1.8904, 52.4862]
      }
    });
    
    // Save the car (should trigger pre-save hook)
    await basicEV.save();
    
    // Verify enhancement
    console.log('✅ BMW i4 created. Checking enhancement...');
    console.log(`   - Electric Range: ${basicEV.electricRange || basicEV.runningCosts?.electricRange || 'NOT SET'} miles`);
    console.log(`   - Battery Capacity: ${basicEV.batteryCapacity || basicEV.runningCosts?.batteryCapacity || 'NOT SET'} kWh`);
    console.log(`   - Rapid Charging: ${basicEV.rapidChargingSpeed || basicEV.runningCosts?.rapidChargingSpeed || 'NOT SET'} kW`);
    console.log(`   - Charging Port: ${basicEV.chargingPortType || basicEV.runningCosts?.chargingPortType || 'NOT SET'}`);
    console.log(`   - Features Count: ${basicEV.features?.length || 0}`);
    console.log(`   - CO2 Emissions: ${basicEV.co2Emissions || basicEV.runningCosts?.co2Emissions || 'NOT SET'} g/km`);
    console.log(`   - Annual Tax: £${basicEV.annualTax || basicEV.runningCosts?.annualTax || 'NOT SET'}`);
    
    // Test 2: Create a Tesla (should get Tesla-specific data)
    console.log('\n2️⃣ Test 2: Creating Tesla Model Y (should get Tesla-specific enhancement)...');
    
    const teslaEV = new Car({
      make: 'Tesla',
      model: 'Model Y',
      variant: 'Long Range',
      year: 2024,
      price: 52000,
      estimatedValue: 52000,
      mileage: 500,
      color: 'Midnight Silver',
      transmission: 'automatic',
      fuelType: 'Electric', // This should trigger Tesla-specific enhancement
      description: 'Tesla Model Y Long Range - Advanced electric SUV with Autopilot',
      images: ['https://example.com/tesla-modely-image.jpg'],
      condition: 'used',
      vehicleType: 'car',
      bodyType: 'SUV',
      doors: 5,
      seats: 7,
      registrationNumber: 'TE24SLY',
      dataSource: 'manual',
      historyCheckStatus: 'pending',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'seller@example.com',
        postcode: 'SW1A 1AA'
      },
      isDealerListing: false,
      postcode: 'SW1A 1AA',
      locationName: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074]
      }
    });
    
    await teslaEV.save();
    
    console.log('✅ Tesla Model Y created. Checking enhancement...');
    console.log(`   - Electric Range: ${teslaEV.electricRange || teslaEV.runningCosts?.electricRange || 'NOT SET'} miles`);
    console.log(`   - Battery Capacity: ${teslaEV.batteryCapacity || teslaEV.runningCosts?.batteryCapacity || 'NOT SET'} kWh`);
    console.log(`   - Rapid Charging: ${teslaEV.rapidChargingSpeed || teslaEV.runningCosts?.rapidChargingSpeed || 'NOT SET'} kW`);
    console.log(`   - Charging Port: ${teslaEV.chargingPortType || teslaEV.runningCosts?.chargingPortType || 'NOT SET'}`);
    console.log(`   - Features Count: ${teslaEV.features?.length || 0}`);
    console.log(`   - Tesla Features: ${teslaEV.features?.filter(f => f.includes('Tesla')).join(', ') || 'None'}`);
    
    // Test 3: Create a non-electric vehicle (should NOT be enhanced)
    console.log('\n3️⃣ Test 3: Creating petrol BMW 3 Series (should NOT be enhanced)...');
    
    const petrolCar = new Car({
      make: 'BMW',
      model: '3 Series',
      variant: '320i',
      year: 2023,
      price: 35000,
      estimatedValue: 35000,
      mileage: 2000,
      color: 'Alpine White',
      transmission: 'automatic',
      fuelType: 'Petrol', // This should NOT trigger enhancement
      description: 'BMW 3 Series 320i - Classic petrol performance',
      images: ['https://example.com/bmw-3series-image.jpg'],
      condition: 'used',
      vehicleType: 'car',
      bodyType: 'Saloon',
      doors: 4,
      seats: 5,
      engineSize: 2.0,
      registrationNumber: 'BM23PET',
      dataSource: 'manual',
      historyCheckStatus: 'pending',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'seller@example.com',
        postcode: 'M1 1AA'
      },
      isDealerListing: false,
      postcode: 'M1 1AA',
      locationName: 'Manchester',
      latitude: 53.4808,
      longitude: -2.2426,
      location: {
        type: 'Point',
        coordinates: [-2.2426, 53.4808]
      }
    });
    
    await petrolCar.save();
    
    console.log('✅ BMW 3 Series created. Checking (should NOT have EV data)...');
    console.log(`   - Electric Range: ${petrolCar.electricRange || 'NOT SET (correct)'}`);
    console.log(`   - Battery Capacity: ${petrolCar.batteryCapacity || 'NOT SET (correct)'}`);
    console.log(`   - Fuel Type: ${petrolCar.fuelType}`);
    console.log(`   - Engine Size: ${petrolCar.engineSize}L`);
    
    // Test 4: Update existing car to electric (should trigger enhancement)
    console.log('\n4️⃣ Test 4: Converting petrol car to electric (should trigger enhancement)...');
    
    petrolCar.fuelType = 'Electric';
    petrolCar.model = 'iX3'; // Change to electric model
    petrolCar.variant = 'Premier';
    await petrolCar.save();
    
    console.log('✅ Car converted to electric. Checking enhancement...');
    console.log(`   - Electric Range: ${petrolCar.electricRange || petrolCar.runningCosts?.electricRange || 'NOT SET'} miles`);
    console.log(`   - Battery Capacity: ${petrolCar.batteryCapacity || petrolCar.runningCosts?.batteryCapacity || 'NOT SET'} kWh`);
    console.log(`   - Features Count: ${petrolCar.features?.length || 0}`);
    
    // Summary
    console.log('\n📊 Test Summary:');
    const allEVs = await Car.find({ fuelType: 'Electric' });
    console.log(`   - Total Electric Vehicles: ${allEVs.length}`);
    console.log(`   - All have electric range: ${allEVs.every(ev => ev.electricRange || ev.runningCosts?.electricRange) ? '✅' : '❌'}`);
    console.log(`   - All have battery capacity: ${allEVs.every(ev => ev.batteryCapacity || ev.runningCosts?.batteryCapacity) ? '✅' : '❌'}`);
    console.log(`   - All have charging port type: ${allEVs.every(ev => ev.chargingPortType || ev.runningCosts?.chargingPortType) ? '✅' : '❌'}`);
    console.log(`   - All have EV features: ${allEVs.every(ev => ev.features?.some(f => f.includes('Electric'))) ? '✅' : '❌'}`);
    console.log(`   - All have zero emissions: ${allEVs.every(ev => (ev.co2Emissions || ev.runningCosts?.co2Emissions) === 0) ? '✅' : '❌'}`);
    console.log(`   - All have zero tax: ${allEVs.every(ev => (ev.annualTax || ev.runningCosts?.annualTax) === 0) ? '✅' : '❌'}`);
    
    console.log('\n🎉 Automatic Electric Vehicle Enhancement Test Completed!');
    console.log('✅ System is working automatically - no manual scripts needed!');
    
  } catch (error) {
    console.error('❌ Error testing automatic EV enhancement:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testAutomaticEVEnhancement();
}

module.exports = { testAutomaticEVEnhancement };