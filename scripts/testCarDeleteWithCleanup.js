const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function testCarDeleteWithCleanup() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🧪 TESTING CAR DELETE WITH VEHICLE HISTORY CLEANUP');
    console.log('===================================================');
    
    // Step 1: Create a test car with vehicle history
    console.log('\n1️⃣ STEP 1: Creating Test Car with Vehicle History');
    console.log('--------------------------------------------------');
    
    const testVRM = 'TEST123';
    
    // Clean up any existing test data
    await Car.deleteMany({ registrationNumber: testVRM });
    await VehicleHistory.deleteMany({ vrm: testVRM });
    
    // Create vehicle history first
    const vehicleHistory = new VehicleHistory({
      vrm: testVRM,
      make: 'TEST',
      model: 'Car',
      accidentDetails: {
        count: 0,
        severity: 'unknown'
      },
      stolenDetails: {
        status: 'active'
      },
      writeOffDetails: {
        category: 'unknown'
      },
      financeDetails: {
        amount: 0,
        type: 'unknown'
      },
      checkStatus: 'success'
    });
    
    const savedHistory = await vehicleHistory.save();
    console.log('✅ Vehicle History created:', savedHistory._id);
    
    // Create test car with reference to vehicle history
    const testCar = new Car({
      make: 'TEST',
      model: 'Car',
      year: 2020,
      registrationNumber: testVRM,
      price: 15000,
      mileage: 50000,
      color: 'Blue',
      transmission: 'manual',
      fuelType: 'Petrol',
      advertStatus: 'active',
      postcode: 'TE1 1ST',
      description: 'Test car for delete functionality testing',
      historyCheckId: savedHistory._id,
      motHistory: [
        {
          testDate: new Date('2023-01-15'),
          testResult: 'PASSED',
          odometerValue: 48000,
          testNumber: 'TEST123456'
        }
      ]
    });
    
    const savedCar = await testCar.save();
    console.log('✅ Test Car created:', savedCar._id);
    console.log('   Registration:', savedCar.registrationNumber);
    console.log('   Vehicle History ID:', savedCar.historyCheckId);
    console.log('   MOT History Count:', savedCar.motHistory.length);
    
    // Step 2: Verify data exists
    console.log('\n2️⃣ STEP 2: Verifying Data Exists');
    console.log('----------------------------------');
    
    const carExists = await Car.findById(savedCar._id);
    const historyExists = await VehicleHistory.findById(savedHistory._id);
    
    console.log('✅ Car exists in database:', !!carExists);
    console.log('✅ Vehicle History exists in database:', !!historyExists);
    
    // Step 3: Test the delete with cleanup
    console.log('\n3️⃣ STEP 3: Testing Delete with Cleanup');
    console.log('---------------------------------------');
    
    console.log('🗑️ Calling Car.deleteCarWithCleanup()...');
    const deleteResult = await Car.deleteCarWithCleanup(savedCar._id);
    
    console.log('Delete Result:', deleteResult);
    
    // Step 4: Verify cleanup
    console.log('\n4️⃣ STEP 4: Verifying Cleanup');
    console.log('------------------------------');
    
    const carAfterDelete = await Car.findById(savedCar._id);
    const historyAfterDelete = await VehicleHistory.findById(savedHistory._id);
    
    console.log('❌ Car exists after delete:', !!carAfterDelete);
    console.log('❌ Vehicle History exists after delete:', !!historyAfterDelete);
    
    if (!carAfterDelete && !historyAfterDelete) {
      console.log('\n🎉 SUCCESS! Both car and vehicle history were deleted');
    } else {
      console.log('\n❌ FAILURE! Some data was not cleaned up properly');
    }
    
    // Step 5: Test API endpoint (simulate)
    console.log('\n5️⃣ STEP 5: API Endpoint Usage Example');
    console.log('--------------------------------------');
    
    console.log('Frontend can call:');
    console.log('DELETE /api/adverts/:id');
    console.log('');
    console.log('Example:');
    console.log('fetch(`/api/adverts/${carId}`, { method: "DELETE" })');
    console.log('  .then(response => response.json())');
    console.log('  .then(data => {');
    console.log('    if (data.success) {');
    console.log('      console.log("Car deleted successfully");');
    console.log('      // Redirect to My Listings page');
    console.log('    }');
    console.log('  });');
    
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCarDeleteWithCleanup();