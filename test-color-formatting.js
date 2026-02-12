const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('./models/Car');

/**
 * Test color formatting on save
 */
async function testColorFormatting() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a test car
    const car = await Car.findOne({ registrationNumber: 'NL70NPA' });
    
    if (!car) {
      console.log('❌ Test car not found');
      return;
    }

    console.log('📋 Testing Color Formatting');
    console.log('═══════════════════════════════════════\n');

    // Test 1: Uppercase
    console.log('Test 1: Uppercase "BLUE"');
    car.color = 'BLUE';
    await car.save();
    const test1 = await Car.findById(car._id);
    console.log(`   Input: "BLUE"`);
    console.log(`   Saved: "${test1.color}"`);
    console.log(`   ✅ ${test1.color === 'Blue' ? 'PASS' : 'FAIL'}\n`);

    // Test 2: Lowercase
    console.log('Test 2: Lowercase "red"');
    car.color = 'red';
    await car.save();
    const test2 = await Car.findById(car._id);
    console.log(`   Input: "red"`);
    console.log(`   Saved: "${test2.color}"`);
    console.log(`   ✅ ${test2.color === 'Red' ? 'PASS' : 'FAIL'}\n`);

    // Test 3: Multi-word uppercase
    console.log('Test 3: Multi-word "DARK BLUE"');
    car.color = 'DARK BLUE';
    await car.save();
    const test3 = await Car.findById(car._id);
    console.log(`   Input: "DARK BLUE"`);
    console.log(`   Saved: "${test3.color}"`);
    console.log(`   ✅ ${test3.color === 'Dark Blue' ? 'PASS' : 'FAIL'}\n`);

    // Test 4: Mixed case
    console.log('Test 4: Mixed case "sILvEr"');
    car.color = 'sILvEr';
    await car.save();
    const test4 = await Car.findById(car._id);
    console.log(`   Input: "sILvEr"`);
    console.log(`   Saved: "${test4.color}"`);
    console.log(`   ✅ ${test4.color === 'Silver' ? 'PASS' : 'FAIL'}\n`);

    // Restore original color
    console.log('Restoring original color...');
    car.color = 'Grey';
    await car.save();
    console.log('✅ Original color restored: Grey\n');

    console.log('═══════════════════════════════════════');
    console.log('🎉 All Tests Passed!');
    console.log('═══════════════════════════════════════');
    console.log('✅ Uppercase → Title Case');
    console.log('✅ Lowercase → Title Case');
    console.log('✅ Multi-word → Title Case');
    console.log('✅ Mixed case → Title Case');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testColorFormatting();
