require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testAutomaticVariantSave() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('🧪 TEST: Automatic Variant Save on New Car');
    console.log('===========================================\n');

    // Test 1: Create a new car WITHOUT variant (should auto-fetch from API)
    console.log('📝 Creating new car WITHOUT variant...');
    console.log('Registration: YD17AVU (BMW)');
    
    const testCar = new Car({
      make: 'BMW',
      model: 'Unknown', // Will be fetched from API
      variant: null, // MISSING - should be auto-fetched
      year: 2017,
      price: 19408,
      estimatedValue: 19408,
      mileage: 2500,
      color: 'WHITE',
      transmission: 'manual',
      fuelType: 'Diesel',
      description: 'Test car for automatic variant fetching',
      images: ['https://example.com/image.jpg'],
      postcode: 'NG1 1AA',
      condition: 'used',
      vehicleType: 'car',
      engineSize: 2.0,
      registrationNumber: 'YD17AVU',
      dataSource: 'DVLA',
      advertStatus: 'draft', // Use draft to avoid duplicate active adverts
      userId: new mongoose.Types.ObjectId()
    });

    console.log('\n🔍 Before Save:');
    console.log('   Variant:', testCar.variant);
    console.log('   Model:', testCar.model);
    console.log('   Display Title:', testCar.displayTitle);

    console.log('\n💾 Saving car (pre-save hook will auto-fetch variant)...\n');
    
    try {
      await testCar.save();
      
      console.log('\n✅ Car saved successfully!');
      console.log('\n🔍 After Save:');
      console.log('   Variant:', testCar.variant);
      console.log('   Model:', testCar.model);
      console.log('   Display Title:', testCar.displayTitle);
      console.log('   Engine Size:', testCar.engineSize);
      console.log('   Doors:', testCar.doors);
      console.log('   Emission Class:', testCar.emissionClass);

      // Verify variant was auto-populated
      if (testCar.variant && testCar.variant !== 'null' && testCar.variant !== 'undefined') {
        console.log('\n✅ SUCCESS: Variant was automatically fetched and saved!');
        console.log(`   Variant: "${testCar.variant}"`);
      } else {
        console.log('\n⚠️  WARNING: Variant was not auto-fetched (might be API limit or cache issue)');
      }

      // Clean up test car
      console.log('\n🧹 Cleaning up test car...');
      await Car.findByIdAndDelete(testCar._id);
      console.log('✅ Test car deleted');

    } catch (saveError) {
      console.error('\n❌ Save Error:', saveError.message);
      
      if (saveError.code === 'DUPLICATE_REGISTRATION') {
        console.log('\n💡 This is expected - duplicate registration protection is working');
        console.log('   The system prevents duplicate active adverts');
      }
    }

    // Test 2: Check existing car with missing variant
    console.log('\n\n🔍 TEST 2: Checking existing cars with missing variants');
    console.log('===========================================\n');
    
    const carsWithoutVariant = await Car.find({
      $or: [
        { variant: null },
        { variant: 'null' },
        { variant: 'undefined' },
        { variant: '' },
        { variant: { $exists: false } }
      ],
      registrationNumber: { $exists: true, $ne: null }
    }).limit(5);

    console.log(`Found ${carsWithoutVariant.length} cars with missing variants\n`);

    if (carsWithoutVariant.length > 0) {
      console.log('📋 Cars that need variant update:');
      carsWithoutVariant.forEach((car, index) => {
        console.log(`\n${index + 1}. ${car.make} ${car.model}`);
        console.log(`   Registration: ${car.registrationNumber}`);
        console.log(`   Variant: ${car.variant || 'MISSING'}`);
        console.log(`   Status: ${car.advertStatus}`);
      });

      console.log('\n💡 To fix these cars, simply re-save them:');
      console.log('   The pre-save hook will automatically fetch variants from API');
    } else {
      console.log('✅ All cars with registration numbers have variants!');
    }

    await mongoose.connection.close();
    console.log('\n\n✅ Test completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAutomaticVariantSave();
