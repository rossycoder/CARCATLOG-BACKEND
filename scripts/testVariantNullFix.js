require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testVariantNullFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Find cars with string "null" as variant
    console.log('\n📊 Test 1: Finding cars with string "null" as variant...');
    const nullVariantCars = await Car.find({ 
      variant: 'null'
    }).limit(5);
    
    console.log(`Found ${nullVariantCars.length} cars with variant = "null"`);
    nullVariantCars.forEach(car => {
      console.log(`  - ${car.make} ${car.model} (${car.registrationNumber}): variant="${car.variant}"`);
    });
    
    // Test 2: Find cars with string "undefined" as variant
    console.log('\n📊 Test 2: Finding cars with string "undefined" as variant...');
    const undefinedVariantCars = await Car.find({ 
      variant: 'undefined'
    }).limit(5);
    
    console.log(`Found ${undefinedVariantCars.length} cars with variant = "undefined"`);
    undefinedVariantCars.forEach(car => {
      console.log(`  - ${car.make} ${car.model} (${car.registrationNumber}): variant="${car.variant}"`);
    });
    
    // Test 3: Find cars with empty string as variant
    console.log('\n📊 Test 3: Finding cars with empty string as variant...');
    const emptyVariantCars = await Car.find({ 
      variant: ''
    }).limit(5);
    
    console.log(`Found ${emptyVariantCars.length} cars with variant = ""`);
    emptyVariantCars.forEach(car => {
      console.log(`  - ${car.make} ${car.model} (${car.registrationNumber}): variant="${car.variant}"`);
    });
    
    // Test 4: Count total problematic variants
    console.log('\n📊 Test 4: Counting all problematic variants...');
    const totalProblematic = await Car.countDocuments({
      $or: [
        { variant: 'null' },
        { variant: 'undefined' },
        { variant: '' },
        { variant: { $exists: false } }
      ]
    });
    
    console.log(`Total cars with problematic variants: ${totalProblematic}`);
    
    // Test 5: Simulate the new logic
    console.log('\n📊 Test 5: Testing new variant assignment logic...');
    
    const testCases = [
      { variant: 'null', modelVariant: '2.0 TDI', expected: '2.0 TDI' },
      { variant: 'undefined', modelVariant: 'Sport', expected: 'Sport' },
      { variant: '', modelVariant: 'SE', expected: 'SE' },
      { variant: '  ', modelVariant: 'GT', expected: 'GT' },
      { variant: 'Valid Variant', modelVariant: 'Ignored', expected: 'Valid Variant' },
      { variant: null, modelVariant: 'null', expected: null },
      { variant: 'null', modelVariant: 'null', expected: null },
      { variant: null, modelVariant: null, expected: null },
      { variant: undefined, modelVariant: undefined, expected: null }
    ];
    
    testCases.forEach((testCase, index) => {
      let result = null;
      
      // New logic
      if (testCase.variant && testCase.variant !== 'null' && testCase.variant !== 'undefined' && testCase.variant.trim() !== '') {
        result = testCase.variant;
      } else if (testCase.modelVariant && testCase.modelVariant !== 'null' && testCase.modelVariant !== 'undefined' && testCase.modelVariant.trim() !== '') {
        result = testCase.modelVariant;
      }
      
      const passed = result === testCase.expected;
      console.log(`  Test ${index + 1}: ${passed ? '✅' : '❌'} variant="${testCase.variant}", modelVariant="${testCase.modelVariant}" => "${result}" (expected: "${testCase.expected}")`);
    });
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testVariantNullFix();
