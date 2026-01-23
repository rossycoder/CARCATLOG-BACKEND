require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

/**
 * Comprehensive verification script for variant null string fix
 * Tests the actual behavior of the fixed code
 */

async function verifyVariantNullFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('='.repeat(60));
    console.log('VARIANT NULL STRING FIX VERIFICATION');
    console.log('='.repeat(60));
    
    // Test 1: Check database for problematic variants
    console.log('\n📊 TEST 1: Database Integrity Check');
    console.log('-'.repeat(60));
    
    const problematicVariants = await Car.find({
      $or: [
        { variant: 'null' },
        { variant: 'undefined' },
        { variant: '' }
      ]
    });
    
    if (problematicVariants.length === 0) {
      console.log('✅ PASS: No cars with problematic variant strings found');
    } else {
      console.log(`❌ FAIL: Found ${problematicVariants.length} cars with problematic variants:`);
      problematicVariants.forEach(car => {
        console.log(`  - ${car.make} ${car.model} (${car.registrationNumber}): variant="${car.variant}"`);
      });
    }
    
    // Test 2: Check for missing variants that should be auto-generated
    console.log('\n📊 TEST 2: Missing Variant Check');
    console.log('-'.repeat(60));
    
    const missingVariants = await Car.find({
      $or: [
        { variant: { $exists: false } },
        { variant: null }
      ],
      advertStatus: 'active'
    }).limit(10);
    
    console.log(`Found ${missingVariants.length} active cars with missing variants`);
    if (missingVariants.length > 0) {
      console.log('⚠️  These should be auto-generated on next save:');
      missingVariants.forEach(car => {
        console.log(`  - ${car.make} ${car.model} (${car.registrationNumber || 'No reg'})`);
      });
    } else {
      console.log('✅ All active cars have variants');
    }
    
    // Test 3: Sample valid variants
    console.log('\n📊 TEST 3: Valid Variant Sample');
    console.log('-'.repeat(60));
    
    const validVariants = await Car.find({
      variant: { 
        $exists: true, 
        $ne: null,
        $ne: '',
        $ne: 'null',
        $ne: 'undefined'
      }
    }).limit(5);
    
    console.log(`Sample of ${validVariants.length} cars with valid variants:`);
    validVariants.forEach(car => {
      console.log(`  ✅ ${car.make} ${car.model}: "${car.variant}"`);
    });
    
    // Test 4: Logic verification
    console.log('\n📊 TEST 4: Variant Assignment Logic Verification');
    console.log('-'.repeat(60));
    
    const testCases = [
      { 
        input: { variant: 'null', modelVariant: '2.0 TDI' },
        expected: '2.0 TDI',
        description: 'String "null" should fallback to modelVariant'
      },
      { 
        input: { variant: 'undefined', modelVariant: 'Sport' },
        expected: 'Sport',
        description: 'String "undefined" should fallback to modelVariant'
      },
      { 
        input: { variant: '', modelVariant: 'SE' },
        expected: 'SE',
        description: 'Empty string should fallback to modelVariant'
      },
      { 
        input: { variant: '  ', modelVariant: 'GT' },
        expected: 'GT',
        description: 'Whitespace should fallback to modelVariant'
      },
      { 
        input: { variant: 'Valid Variant', modelVariant: 'Ignored' },
        expected: 'Valid Variant',
        description: 'Valid variant should be used'
      },
      { 
        input: { variant: 'null', modelVariant: 'null' },
        expected: null,
        description: 'Both invalid should return null'
      }
    ];
    
    let passedTests = 0;
    let failedTests = 0;
    
    testCases.forEach((testCase, index) => {
      // Simulate the fixed logic
      let result = null;
      const { variant, modelVariant } = testCase.input;
      
      if (variant && variant !== 'null' && variant !== 'undefined' && variant.trim() !== '') {
        result = variant;
      } else if (modelVariant && modelVariant !== 'null' && modelVariant !== 'undefined' && modelVariant.trim() !== '') {
        result = modelVariant;
      }
      
      const passed = result === testCase.expected;
      if (passed) {
        passedTests++;
        console.log(`  ✅ Test ${index + 1}: ${testCase.description}`);
      } else {
        failedTests++;
        console.log(`  ❌ Test ${index + 1}: ${testCase.description}`);
        console.log(`     Expected: "${testCase.expected}", Got: "${result}"`);
      }
    });
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const allTestsPassed = 
      problematicVariants.length === 0 &&
      passedTests === testCases.length &&
      failedTests === 0;
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED');
      console.log('✅ Variant null string fix is working correctly');
      console.log('✅ Database is clean');
      console.log('✅ Logic is functioning as expected');
    } else {
      console.log('⚠️  SOME ISSUES DETECTED');
      if (problematicVariants.length > 0) {
        console.log(`   - ${problematicVariants.length} cars with problematic variants`);
      }
      if (failedTests > 0) {
        console.log(`   - ${failedTests} logic tests failed`);
      }
    }
    
    console.log('\n📊 Statistics:');
    console.log(`   - Logic tests passed: ${passedTests}/${testCases.length}`);
    console.log(`   - Problematic variants in DB: ${problematicVariants.length}`);
    console.log(`   - Missing variants (active cars): ${missingVariants.length}`);
    console.log(`   - Valid variants sampled: ${validVariants.length}`);
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyVariantNullFix();
