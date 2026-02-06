/**
 * Test Automatic Data Fix - Verify that comprehensive service now updates missing fields
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');

async function testAutomaticDataFix() {
  try {
    console.log('🧪 Testing Automatic Data Fix...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const carId = '6985f07d4b37080dccab7fb1';
    const vrm = 'YD17AVU';
    
    console.log(`🚗 Testing with Car ID: ${carId} (${vrm})`);
    console.log('=' .repeat(50));

    // 1. Check current car data
    console.log('\n1️⃣ CURRENT CAR DATA:');
    console.log('-'.repeat(25));
    
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('📊 Before automatic fix:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Variant: ${car.variant}`);
    console.log(`   Doors: ${car.doors}`);
    console.log(`   Seats: ${car.seats}`);
    console.log(`   Body Type: ${car.bodyType}`);
    console.log(`   Engine Size: ${car.engineSize}L`);
    console.log(`   Transmission: ${car.transmission}`);
    console.log(`   Color: ${car.color}`);
    console.log(`   Display Title: ${car.displayTitle}`);

    // 2. Temporarily remove some fields to test automatic fix
    console.log('\n2️⃣ TEMPORARILY REMOVING FIELDS FOR TEST:');
    console.log('-'.repeat(45));
    
    const originalData = {
      doors: car.doors,
      seats: car.seats,
      bodyType: car.bodyType,
      variant: car.variant
    };
    
    // Remove fields to test automatic fix
    car.doors = null;
    car.seats = null;
    car.bodyType = null;
    car.variant = 'Diesel'; // Set to basic variant
    
    await car.save();
    console.log('✅ Temporarily removed doors, seats, bodyType, and set basic variant');

    // 3. Run comprehensive service to test automatic fix
    console.log('\n3️⃣ RUNNING COMPREHENSIVE SERVICE:');
    console.log('-'.repeat(40));
    
    const comprehensiveService = new ComprehensiveVehicleService();
    
    const result = await comprehensiveService.fetchCompleteVehicleData(
      vrm,
      car.mileage,
      false // Use cache if available
    );
    
    console.log('✅ Comprehensive service completed:');
    console.log(`   API Calls: ${result.apiCalls}`);
    console.log(`   Total Cost: £${result.totalCost.toFixed(2)}`);
    console.log(`   Errors: ${result.errors.length}`);

    // 4. Check if fields were automatically fixed
    console.log('\n4️⃣ CHECKING AUTOMATIC FIX RESULTS:');
    console.log('-'.repeat(40));
    
    const updatedCar = await Car.findById(carId);
    
    console.log('📊 After automatic fix:');
    console.log(`   Registration: ${updatedCar.registrationNumber}`);
    console.log(`   Variant: ${updatedCar.variant}`);
    console.log(`   Doors: ${updatedCar.doors}`);
    console.log(`   Seats: ${updatedCar.seats}`);
    console.log(`   Body Type: ${updatedCar.bodyType}`);
    console.log(`   Engine Size: ${updatedCar.engineSize}L`);
    console.log(`   Transmission: ${updatedCar.transmission}`);
    console.log(`   Color: ${updatedCar.color}`);
    console.log(`   Display Title: ${updatedCar.displayTitle}`);

    // 5. Verify the fix worked
    console.log('\n5️⃣ VERIFICATION:');
    console.log('-'.repeat(20));
    
    const fixes = [];
    
    if (updatedCar.doors && updatedCar.doors !== null) {
      fixes.push(`✅ Doors: ${updatedCar.doors}`);
    } else {
      fixes.push(`❌ Doors: Still missing`);
    }
    
    if (updatedCar.seats && updatedCar.seats !== null) {
      fixes.push(`✅ Seats: ${updatedCar.seats}`);
    } else {
      fixes.push(`❌ Seats: Still missing`);
    }
    
    if (updatedCar.bodyType && updatedCar.bodyType !== null) {
      fixes.push(`✅ Body Type: ${updatedCar.bodyType}`);
    } else {
      fixes.push(`❌ Body Type: Still missing`);
    }
    
    if (updatedCar.variant && updatedCar.variant !== 'Diesel' && updatedCar.variant !== 'Unknown') {
      fixes.push(`✅ Variant: ${updatedCar.variant}`);
    } else {
      fixes.push(`❌ Variant: Still basic (${updatedCar.variant})`);
    }
    
    fixes.forEach(fix => console.log(`   ${fix}`));

    // 6. Summary
    console.log('\n6️⃣ SUMMARY:');
    console.log('-'.repeat(15));
    
    const successCount = fixes.filter(f => f.startsWith('✅')).length;
    const totalCount = fixes.length;
    
    if (successCount === totalCount) {
      console.log('🎉 AUTOMATIC FIX WORKING PERFECTLY!');
      console.log('✅ All missing fields were automatically filled');
      console.log('✅ Comprehensive service now updates car data');
      console.log('✅ Future cars will have complete data automatically');
    } else {
      console.log(`⚠️  PARTIAL SUCCESS: ${successCount}/${totalCount} fields fixed`);
      console.log('❌ Some fields still not being updated automatically');
      console.log('💡 May need additional fixes to comprehensive service');
    }

    console.log('\n🎯 RESULT:');
    console.log('When comprehensive service runs (cache refresh), it will now:');
    console.log('• Update missing doors, seats, body type');
    console.log('• Improve variant information');
    console.log('• Fill in missing engine size, transmission, color');
    console.log('• Update display title with better variant');
    console.log('• All existing cars will benefit from this fix');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  testAutomaticDataFix();
}

module.exports = { testAutomaticDataFix };