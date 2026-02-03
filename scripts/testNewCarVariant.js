require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const { v4: uuidv4 } = require('uuid');

async function testNewCarVariant() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('🚗 Testing New Car Creation with Automatic Variant...\n');

    // Create a new test car (using a different registration)
    const testRegistration = 'AB12CDE'; // Different car for testing
    
    const car = new Car({
      advertId: uuidv4(),
      make: 'HONDA',
      model: 'Civic',
      variant: null, // Intentionally leave empty to test auto-fetch
      year: 2011,
      mileage: 45000,
      color: 'Silver',
      fuelType: 'Petrol',
      transmission: 'manual',
      price: 8500,
      estimatedValue: 8500,
      description: 'Test car for variant auto-fetch',
      images: [],
      registrationNumber: testRegistration,
      engineSize: 1.8,
      bodyType: 'Hatchback',
      doors: 5,
      seats: 5,
      dataSource: 'DVLA',
      advertStatus: 'active',
      publishedAt: new Date(),
      condition: 'used',
      postcode: 'M1 1AA'
    });

    console.log('📊 NEW CAR BEFORE SAVE:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('Make/Model:', `${car.make} ${car.model}`);
    console.log('Variant:', car.variant || 'NOT SET (will be auto-fetched)');
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('\n');

    console.log('💾 Saving new car (this will trigger variant auto-fetch)...\n');
    
    // Save car - this will trigger the pre-save hook to fetch variant
    await car.save();

    console.log('\n📊 NEW CAR AFTER SAVE:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('Make/Model:', `${car.make} ${car.model}`);
    console.log('Variant:', car.variant || 'STILL NOT SET');
    console.log('DisplayTitle:', car.displayTitle || 'NOT SET');
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('Car ID:', car._id);
    console.log('Advert ID:', car.advertId);

    if (car.variant && car.variant !== 'null' && car.variant !== 'undefined') {
      console.log('\n✅ SUCCESS: New car created with automatic variant!');
      console.log(`   Variant: "${car.variant}"`);
      console.log(`   Display Title: "${car.displayTitle}"`);
    } else {
      console.log('\n❌ FAILED: Variant was not set automatically');
    }

    // Clean up - delete the test car
    console.log('\n🧹 Cleaning up test car...');
    await Car.deleteOne({ _id: car._id });
    console.log('✅ Test car deleted');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNewCarVariant();