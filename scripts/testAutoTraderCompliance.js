/**
 * Test AutoTrader Compliance
 * Verifies that data normalization is working correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const { 
  normalizeEngineSize, 
  formatEngineSize,
  extractTrimFromSubmodel,
  sanitizeDescription,
  generateDisplayTitle,
  validateVehicleData
} = require('../utils/vehicleDataNormalizer');

async function testAutoTraderCompliance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING AUTOTRADER COMPLIANCE');
    console.log('='.repeat(60));

    // Test 1: Engine Size Normalization
    console.log('\n📊 Test 1: Engine Size Normalization');
    console.log('-'.repeat(60));
    const engineTests = [
      { input: 2, expected: 2.0 },
      { input: 1.6, expected: 1.6 },
      { input: 2000, expected: 2.0 },
      { input: 1598, expected: 1.6 },
      { input: 3, expected: 3.0 }
    ];
    
    engineTests.forEach(test => {
      const result = normalizeEngineSize(test.input);
      const formatted = formatEngineSize(result);
      const pass = result === test.expected;
      console.log(`${pass ? '✅' : '❌'} ${test.input} → ${result} (${formatted}) [expected: ${test.expected}]`);
    });

    // Test 2: Submodel Extraction
    console.log('\n📊 Test 2: Submodel/Trim Extraction');
    console.log('-'.repeat(60));
    const submodelTests = [
      { input: 'Petrol manual', expected: '' },
      { input: '320D M Sport', expected: '320D M Sport' },
      { input: '335I M Sport Diesel', expected: '335I M Sport' },
      { input: 'SE TDI Manual', expected: 'SE TDI' }
    ];
    
    submodelTests.forEach(test => {
      const result = extractTrimFromSubmodel(test.input, 'Diesel', 'Manual');
      const pass = result === test.expected || (result === null && test.expected === '');
      console.log(`${pass ? '✅' : '❌'} "${test.input}" → "${result || ''}" [expected: "${test.expected}"]`);
    });

    // Test 3: Description Sanitization
    console.log('\n📊 Test 3: Description Sanitization');
    console.log('-'.repeat(60));
    const descTests = [
      { input: 'Great car in excellent condition', shouldPass: true },
      { input: '{ "_id": "123", "password": "secret" }', shouldPass: false },
      { input: 'password: secret123', shouldPass: false }
    ];
    
    descTests.forEach(test => {
      const result = sanitizeDescription(test.input);
      const pass = test.shouldPass ? result.length > 0 : result.length === 0;
      console.log(`${pass ? '✅' : '❌'} "${test.input.substring(0, 40)}..." → ${result.length > 0 ? 'CLEAN' : 'REMOVED'}`);
    });

    // Test 4: Display Title Generation
    console.log('\n📊 Test 4: Display Title Generation');
    console.log('-'.repeat(60));
    const titleTests = [
      {
        vehicle: { make: 'BMW', model: '3 Series', engineSize: 2.0, variant: '320d M Sport', transmission: 'manual' },
        expected: 'BMW 3 Series 2.0L 320d M Sport Manual'
      },
      {
        vehicle: { make: 'Audi', model: 'A4', engineSize: 1.6, variant: 'SE TDI', transmission: 'automatic' },
        expected: 'Audi A4 1.6L SE TDI Automatic'
      }
    ];
    
    titleTests.forEach(test => {
      const result = generateDisplayTitle(test.vehicle);
      const pass = result === test.expected;
      console.log(`${pass ? '✅' : '❌'} ${result}`);
      if (!pass) console.log(`   Expected: ${test.expected}`);
    });

    // Test 5: Database Sample Check
    console.log('\n📊 Test 5: Database Sample Check');
    console.log('-'.repeat(60));
    const sampleCars = await Car.find({ advertStatus: 'active' }).limit(5);
    
    console.log(`Found ${sampleCars.length} active cars to check:\n`);
    
    sampleCars.forEach((car, idx) => {
      console.log(`${idx + 1}. ${car.make} ${car.model} (${car.registrationNumber || 'No reg'})`);
      console.log(`   Engine: ${car.engineSize ? formatEngineSize(car.engineSize) : 'Missing'}`);
      console.log(`   Submodel: "${car.submodel || 'None'}"`);
      console.log(`   Variant: "${car.variant || 'None'}"`);
      console.log(`   Display Title: "${car.displayTitle || 'None'}"`);
      
      // Check for issues
      const issues = [];
      if (!car.engineSize || car.engineSize < 0.8 || car.engineSize > 10) {
        issues.push('❌ Invalid engine size');
      }
      if (car.submodel && (car.submodel.toLowerCase().includes('petrol') || car.submodel.toLowerCase().includes('manual'))) {
        issues.push('❌ Submodel contains fuel/transmission');
      }
      if (car.description && (car.description.includes('_id') || car.description.includes('password'))) {
        issues.push('❌ Description contains garbage data');
      }
      if (!car.displayTitle) {
        issues.push('⚠️  Missing display title');
      }
      
      if (issues.length > 0) {
        issues.forEach(issue => console.log(`   ${issue}`));
      } else {
        console.log(`   ✅ All checks passed`);
      }
      console.log('');
    });

    // Test 6: Duplicate Check
    console.log('\n📊 Test 6: Duplicate Registration Check');
    console.log('-'.repeat(60));
    const duplicates = await Car.aggregate([
      {
        $match: {
          registrationNumber: { $exists: true, $ne: null, $ne: '' },
          advertStatus: 'active'
        }
      },
      {
        $group: {
          _id: '$registrationNumber',
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate active adverts found');
    } else {
      console.log(`❌ Found ${duplicates.length} registration numbers with duplicates:`);
      duplicates.forEach(dup => {
        console.log(`   - ${dup._id}: ${dup.count} active adverts`);
      });
    }

    // Test 7: Validation Function
    console.log('\n📊 Test 7: Validation Function');
    console.log('-'.repeat(60));
    const validationTests = [
      {
        vehicle: { make: 'BMW', model: '3 Series', year: 2020, fuelType: 'Diesel', transmission: 'manual', engineSize: 2.0 },
        shouldPass: true
      },
      {
        vehicle: { make: 'BMW', model: '3 Series', year: 2020, fuelType: 'Diesel', transmission: 'manual', engineSize: 50 },
        shouldPass: false
      },
      {
        vehicle: { make: 'BMW', model: '3 Series', year: 2020, fuelType: 'Diesel', transmission: 'manual', description: '{ "_id": "123" }' },
        shouldPass: false
      }
    ];

    validationTests.forEach((test, idx) => {
      const result = validateVehicleData(test.vehicle);
      const pass = result.valid === test.shouldPass;
      console.log(`${pass ? '✅' : '❌'} Test ${idx + 1}: ${result.valid ? 'VALID' : 'INVALID'}`);
      if (result.errors.length > 0) {
        result.errors.forEach(err => console.log(`   - ${err}`));
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLIANCE TESTING COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run tests
testAutoTraderCompliance();
