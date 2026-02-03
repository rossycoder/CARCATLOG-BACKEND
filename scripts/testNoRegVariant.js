require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testNoRegVariant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing Variant Generation for Cars WITHOUT Registration');
    console.log('='.repeat(60));

    // Test: Car without registration - should generate variant from engine + fuel
    const noRegCar = new Car({
      make: 'TOYOTA',
      model: 'Corolla',
      year: 2020,
      price: 20000,
      mileage: 15000,
      color: 'White',
      transmission: 'automatic',
      fuelType: 'Hybrid',
      description: 'Car without registration for variant test',
      postcode: 'L1 1AA',
      // No registrationNumber - should generate from engine + fuel
      engineSize: 1.8,
      doors: 4,
      seats: 5,
      bodyType: 'Saloon',
      condition: 'used',
      vehicleType: 'car',
      advertStatus: 'active',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'noreg@example.com'
      }
    });

    console.log('\n📋 Before save:');
    console.log(`   Variant: "${noRegCar.variant}"`);
    console.log(`   Display Title: "${noRegCar.displayTitle}"`);
    console.log(`   Engine Size: ${noRegCar.engineSize}L`);
    console.log(`   Fuel Type: ${noRegCar.fuelType}`);

    console.log('\n⏳ Saving car (should generate variant from engine + fuel)...');
    await noRegCar.save();

    console.log('\n✅ RESULT AFTER SAVE:');
    console.log(`   Variant: "${noRegCar.variant}"`);
    console.log(`   Display Title: "${noRegCar.displayTitle}"`);
    console.log(`   Expected: "1.8L Hybrid"`);
    
    // Verify the result
    if (noRegCar.variant === '1.8L Hybrid') {
      console.log('\n🎉 SUCCESS: Variant correctly generated for car without registration!');
    } else {
      console.log('\n❌ FAILED: Variant not generated correctly');
    }

    // Clean up
    console.log('\n🧹 Cleaning up test car...');
    await Car.findByIdAndDelete(noRegCar._id);
    console.log('✅ Test car deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testNoRegVariant();