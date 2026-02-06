/**
 * Test Automatic Data Fix with Force Refresh - Force fresh API calls to test the fix
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');

async function testAutomaticDataFixForced() {
  try {
    console.log('🧪 Testing Automatic Data Fix (FORCED REFRESH)...\n');

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

    // 2. Remove some fields to test automatic fix
    console.log('\n2️⃣ REMOVING FIELDS FOR TEST:');
    console.log('-'.repeat(35));
    
    // Remove fields to test automatic fix
    car.doors = null;
    car.seats = null;
    car.bodyType = null;
    car.variant = 'Diesel'; // Set to basic variant
    car.displayTitle = '2 Diesel'; // Basic display title
    
    await car.save();
    console.log('✅ Removed doors, seats, bodyType, and set basic variant');

    // 3. Run comprehensive service with FORCE REFRESH
    console.log('\n3️⃣ RUNNING COMPREHENSIVE SERVICE (FORCE REFRESH):');
    console.log('-'.repeat(55));
    
    const comprehensiveService = new ComprehensiveVehicleService();
    
    const result = await comprehensiveService.fetchCompleteVehicleData(
      vrm,
      car.mileage,
      true // FORCE REFRESH - This will make fresh API calls
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
      fixes.push(`✅ Doors: ${updatedCar.doors} (FIXED!)`);
    } else {
      fixes.push(`❌ Doors: Still missing`);
    }
    
    if (updatedCar.seats && updatedCar.seats !== null) {
      fixes.push(`✅ Seats: ${updatedCar.seats} (FIXED!)`);
    } else {
      fixes.push(`❌ Seats: Still missing`);
    }
    
    if (updatedCar.bodyType && updatedCar.bodyType !== null) {
      fixes.push(`✅ Body Type: ${updatedCar.bodyType} (FIXED!)`);
    } else {
      fixes.push(`❌ Body Type: Still missing`);
    }
    
    if (updatedCar.variant && updatedCar.variant !== 'Diesel' && updatedCar.variant !== 'Unknown') {
      fixes.push(`✅ Variant: ${updatedCar.variant} (FIXED!)`);
    } else {
      fixes.push(`❌ Variant: Still basic (${updatedCar.variant})`);
    }
    
    if (updatedCar.displayTitle && updatedCar.displayTitle !== '2 Diesel') {
      fixes.push(`✅ Display Title: ${updatedCar.displayTitle} (FIXED!)`);
    } else {
      fixes.push(`❌ Display Title: Still basic (${updatedCar.displayTitle})`);
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
    } else if (successCount > 0) {
      console.log(`🔄 PARTIAL SUCCESS: ${successCount}/${totalCount} fields fixed`);
      console.log('✅ Some automatic fixes are working');
      console.log('⚠️  Some fields still need manual attention');
    } else {
      console.log(`❌ NO AUTOMATIC FIXES: 0/${totalCount} fields fixed`);
      console.log('❌ Comprehensive service not updating missing fields');
      console.log('💡 Need to debug the updateCarWithCompleteData function');
    }

    console.log('\n🎯 NEXT STEPS:');
    if (successCount === totalCount) {
      console.log('✅ System is working perfectly - no action needed');
      console.log('✅ All future cars will have complete data');
    } else {
      console.log('🔧 Need to improve automatic data updating');
      console.log('💡 Check why some fields are not being updated');
      console.log('🔍 Debug the comprehensive service data flow');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  testAutomaticDataFixForced();
}

module.exports = { testAutomaticDataFixForced };