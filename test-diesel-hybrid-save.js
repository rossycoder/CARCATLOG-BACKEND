require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function testDieselHybridSave() {
  try {
    console.log('🧪 Testing Diesel Hybrid Save\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Create VehicleHistory with Diesel Hybrid
    console.log('📝 Test 1: Creating VehicleHistory with Diesel Hybrid...');
    const historyData = {
      vrm: 'TEST123',
      make: 'Kia',
      model: 'XCeed 3 CRDi ISG MHEV',
      variant: 'XCEED CRDI 3 ISG',
      fuelType: 'Diesel Hybrid',
      yearOfManufacture: 2021,
      engineCapacity: 1598,
      bodyType: 'HATCHBACK',
      transmission: 'manual',
      doors: 5,
      seats: 5,
      checkDate: new Date()
    };
    
    const history = new VehicleHistory(historyData);
    await history.save();
    console.log('✅ VehicleHistory saved successfully!');
    console.log('   Fuel Type:', history.fuelType);
    console.log('   ID:', history._id);
    
    // Test 2: Create Car with Diesel Hybrid
    console.log('\n📝 Test 2: Creating Car with Diesel Hybrid...');
    const carData = {
      make: 'Kia',
      model: 'XCeed 3 CRDi ISG',
      variant: 'XCEED CRDI 3 ISG',
      year: 2021,
      price: 10430,
      estimatedValue: 10430,
      mileage: 103000,
      color: 'WHITE',
      transmission: 'manual',
      fuelType: 'Diesel Hybrid',  // ✅ Testing this
      description: 'Test Diesel Hybrid',
      images: [],
      condition: 'used',
      vehicleType: 'car',
      bodyType: 'HATCHBACK',
      doors: 5,
      seats: 5,
      engineSize: 1598,
      registrationNumber: 'TEST123',
      dataSource: 'DVLA',
      co2Emissions: 110,
      historyCheckId: history._id,
      sellerContact: {
        type: 'private',
        phoneNumber: '07446975601',
        email: 'test@example.com',
        allowEmailContact: true,
        postcode: 'CM95ET'
      },
      isDealerListing: false,
      advertStatus: 'pending',
      advertId: 'test-diesel-hybrid-' + Date.now()
    };
    
    const car = new Car(carData);
    await car.save();
    console.log('✅ Car saved successfully!');
    console.log('   Fuel Type:', car.fuelType);
    console.log('   ID:', car._id);
    console.log('   Electric Range:', car.electricRange, '(should be null)');
    console.log('   Battery Capacity:', car.batteryCapacity, '(should be null)');
    
    // Test 3: Verify data in database
    console.log('\n📝 Test 3: Verifying data in database...');
    const savedCar = await Car.findById(car._id);
    const savedHistory = await VehicleHistory.findById(history._id);
    
    console.log('\n✅ VERIFICATION RESULTS:');
    console.log('='.repeat(60));
    console.log('Car Fuel Type:', savedCar.fuelType);
    console.log('VehicleHistory Fuel Type:', savedHistory.fuelType);
    console.log('Car has EV fields:', {
      electricRange: savedCar.electricRange,
      batteryCapacity: savedCar.batteryCapacity,
      chargingTime: savedCar.chargingTime
    });
    console.log('='.repeat(60));
    
    // Validate
    if (savedCar.fuelType === 'Diesel Hybrid' && savedHistory.fuelType === 'Diesel Hybrid') {
      console.log('\n🎉 SUCCESS! Diesel Hybrid saved correctly in both models!');
    } else {
      console.log('\n❌ FAILED! Fuel type not saved correctly');
    }
    
    if (!savedCar.electricRange && !savedCar.batteryCapacity) {
      console.log('✅ EV fields correctly removed from hybrid vehicle');
    } else {
      console.log('⚠️  Warning: EV fields still present on hybrid vehicle');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Car.deleteOne({ _id: car._id });
    await VehicleHistory.deleteOne({ _id: history._id });
    console.log('✅ Test data cleaned up');
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete - Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
}

testDieselHybridSave();
