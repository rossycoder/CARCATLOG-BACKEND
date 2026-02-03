/**
 * Test Write-off Warning Badge Implementation
 * Create test cars with different write-off categories to verify frontend display
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function testWriteOffWarningBadge() {
  try {
    console.log('🧪 Testing Write-off Warning Badge Implementation\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test data for different write-off categories
    const testCars = [
      {
        vrm: 'TEST001',
        category: 'A',
        description: 'CAT A - Scrap Only',
        shouldShowWarning: true
      },
      {
        vrm: 'TEST002', 
        category: 'B',
        description: 'CAT B - Break for Parts',
        shouldShowWarning: true
      },
      {
        vrm: 'TEST003',
        category: 'S', 
        description: 'CAT S - Structural Damage',
        shouldShowWarning: true
      },
      {
        vrm: 'TEST004',
        category: 'C',
        description: 'CAT C - Repairable (Old)',
        shouldShowWarning: false
      },
      {
        vrm: 'TEST005',
        category: 'D',
        description: 'CAT D - Light Damage (Old)', 
        shouldShowWarning: false
      },
      {
        vrm: 'TEST006',
        category: 'N',
        description: 'CAT N - Non-structural',
        shouldShowWarning: false
      }
    ];
    
    console.log('🚗 Creating test cars with different write-off categories...\n');
    
    // Clean up existing test data
    await Car.deleteMany({ registrationNumber: { $in: testCars.map(t => t.vrm) } });
    await VehicleHistory.deleteMany({ vrm: { $in: testCars.map(t => t.vrm) } });
    
    for (const testCar of testCars) {
      console.log(`Creating ${testCar.vrm} - ${testCar.description}...`);
      
      // Create VehicleHistory document
      const vehicleHistory = new VehicleHistory({
        vrm: testCar.vrm,
        make: 'TEST',
        model: 'Car',
        colour: 'Red',
        fuelType: 'Petrol',
        yearOfManufacture: 2020,
        engineCapacity: 1600,
        transmission: 'Manual',
        numberOfPreviousKeepers: 2,
        isWrittenOff: true,
        writeOffCategory: testCar.category,
        writeOffDetails: {
          category: testCar.category,
          status: `CAT ${testCar.category} VEHICLE DAMAGED`,
          date: '2023-01-01',
          description: testCar.description
        },
        checkDate: new Date(),
        checkStatus: 'success',
        apiProvider: 'test'
      });
      
      await vehicleHistory.save();
      
      // Create Car document
      const car = new Car({
        registrationNumber: testCar.vrm,
        make: 'TEST',
        model: 'Car',
        variant: 'Test Variant',
        year: 2020,
        price: 10000,
        mileage: 50000,
        color: 'Red',
        fuelType: 'Petrol',
        transmission: 'manual',
        description: `Test car for ${testCar.description}`,
        postcode: 'M1 1AA',
        historyCheckId: vehicleHistory._id,
        historyCheckStatus: 'verified',
        historyCheckDate: new Date(),
        advertStatus: 'active',
        dataSource: 'manual'
      });
      
      await car.save();
      
      console.log(`✅ Created ${testCar.vrm} with CAT ${testCar.category} (ID: ${car._id})`);
    }
    
    console.log('\n📋 Test Results Summary:');
    console.log('Cars that SHOULD show warning badge (CAT A, B, S):');
    testCars.filter(t => t.shouldShowWarning).forEach(t => {
      console.log(`  ⚠️  ${t.vrm} - ${t.description}`);
    });
    
    console.log('\nCars that should NOT show warning badge (CAT C, D, N):');
    testCars.filter(t => !t.shouldShowWarning).forEach(t => {
      console.log(`  ℹ️  ${t.vrm} - ${t.description}`);
    });
    
    console.log('\n🌐 Frontend Testing URLs:');
    const createdCars = await Car.find({ registrationNumber: { $in: testCars.map(t => t.vrm) } });
    createdCars.forEach(car => {
      const testData = testCars.find(t => t.vrm === car.registrationNumber);
      const warningStatus = testData.shouldShowWarning ? '⚠️ WARNING' : 'ℹ️ INFO';
      console.log(`  ${warningStatus}: http://localhost:3000/cars/${car._id} (${car.registrationNumber} - CAT ${testData.category})`);
    });
    
    console.log('\n✅ Test data created successfully!');
    console.log('💡 Open the URLs above to test the write-off warning badge display');
    console.log('🔴 Red warning badges should appear for CAT A, B, S only');
    
    // Cleanup option
    console.log('\n🧹 To cleanup test data, run:');
    console.log('   Car.deleteMany({ registrationNumber: /^TEST/ })');
    console.log('   VehicleHistory.deleteMany({ vrm: /^TEST/ })');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testWriteOffWarningBadge();