require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testVariantFix() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the latest active car
    const car = await Car.findOne({ advertStatus: 'active' }).sort({ createdAt: -1 });
    
    if (!car) {
      console.log('❌ No active cars found');
      process.exit(1);
    }

    console.log('📊 Testing Variant Fix:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('Make/Model:', `${car.make} ${car.model}`);
    console.log('BEFORE - Variant:', car.variant || 'NOT SET');
    console.log('BEFORE - DisplayTitle:', car.displayTitle || 'NOT SET');
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('\n');

    // Clear variant to test auto-fetch
    car.variant = null;
    console.log('🧪 Cleared variant to test auto-fetch...\n');

    // Save car - this will trigger the pre-save hook
    console.log('💾 Saving car to trigger variant auto-fetch...\n');
    await car.save();

    console.log('\n📊 AFTER Save:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('AFTER - Variant:', car.variant || 'STILL NOT SET');
    console.log('AFTER - DisplayTitle:', car.displayTitle || 'STILL NOT SET');
    console.log('Make/Model:', `${car.make} ${car.model}`);
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);

    if (car.variant && car.variant !== 'null' && car.variant !== 'undefined') {
      console.log('\n✅ SUCCESS: Variant is now set automatically!');
    } else {
      console.log('\n❌ FAILED: Variant is still not set');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testVariantFix();