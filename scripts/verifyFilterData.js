require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

/**
 * Comprehensive database verification script for filter data
 * Checks vehicle counts, field population, and data quality
 */

async function verifyFilterData() {
  try {
    console.log('='.repeat(80));
    console.log('🔍 DATABASE FILTER DATA VERIFICATION');
    console.log('='.repeat(80));
    console.log();

    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set in environment variables');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log();

    // Step 1: Count vehicles by status
    console.log('📍 STEP 1: Vehicle Count by Status');
    console.log('-'.repeat(80));
    
    const totalVehicles = await Car.countDocuments();
    console.log(`Total vehicles: ${totalVehicles}`);
    
    if (totalVehicles === 0) {
      console.log();
      console.log('❌ DATABASE IS EMPTY!');
      console.log('   No vehicles found in the database.');
      console.log('   This is why filter options are empty.');
      console.log();
      console.log('💡 Solution: Populate the database with vehicles.');
      console.log('   Run one of these scripts:');
      console.log('   - node backend/scripts/seedCarsWithPostcodes.js');
      console.log('   - node backend/scripts/seedBikes.js');
      console.log();
      await mongoose.connection.close();
      process.exit(0);
    }

    const statuses = await Car.aggregate([
      { $group: { _id: '$advertStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log();
    statuses.forEach(s => {
      const status = s._id || 'null/undefined';
      const icon = status === 'active' ? '✅' : '📋';
      console.log(`${icon} ${status}: ${s.count}`);
    });
    console.log();

    const activeCount = await Car.countDocuments({ advertStatus: 'active' });
    
    if (activeCount === 0) {
      console.log('⚠️  WARNING: No active vehicles found!');
      console.log('   Filter options require vehicles with advertStatus: "active"');
      console.log();
      console.log('💡 Solution: Activate existing vehicles.');
      console.log('   Run: node backend/scripts/activateAllCars.js');
      console.log();
    }

    // Step 2: Check filter field population on active vehicles
    console.log('📍 STEP 2: Filter Field Population (Active Vehicles Only)');
    console.log('-'.repeat(80));
    console.log();

    if (activeCount > 0) {
      const filterFields = [
        { field: 'make', label: 'Make' },
        { field: 'model', label: 'Model' },
        { field: 'color', label: 'Color' },
        { field: 'fuelType', label: 'Fuel Type' },
        { field: 'transmission', label: 'Transmission' },
        { field: 'bodyType', label: 'Body Type' },
        { field: 'year', label: 'Year' }
      ];

      console.log(`Checking ${activeCount} active vehicles...\n`);

      for (const { field, label } of filterFields) {
        // Count vehicles with this field populated
        const query = { advertStatus: 'active' };
        query[field] = { $exists: true, $ne: null, $ne: '' };
        
        const populatedCount = await Car.countDocuments(query);
        const percentage = ((populatedCount / activeCount) * 100).toFixed(1);
        
        // Get unique values
        const uniqueValues = await Car.distinct(field, { advertStatus: 'active' });
        const nonNullValues = uniqueValues.filter(v => v !== null && v !== undefined && v !== '');
        
        const icon = populatedCount === activeCount ? '✅' : populatedCount > 0 ? '⚠️ ' : '❌';
        console.log(`${icon} ${label.padEnd(15)} ${populatedCount}/${activeCount} (${percentage}%) - ${nonNullValues.length} unique values`);
        
        // Show sample values
        if (nonNullValues.length > 0 && nonNullValues.length <= 10) {
          console.log(`   Values: ${nonNullValues.join(', ')}`);
        } else if (nonNullValues.length > 10) {
          console.log(`   Sample: ${nonNullValues.slice(0, 5).join(', ')}, ...`);
        }
      }
      console.log();

      // Step 3: Identify vehicles with missing filter data
      console.log('📍 STEP 3: Vehicles with Missing Filter Data');
      console.log('-'.repeat(80));
      console.log();

      const vehiclesWithMissingData = await Car.find({
        advertStatus: 'active',
        $or: [
          { make: { $in: [null, ''] } },
          { model: { $in: [null, ''] } },
          { color: { $in: [null, ''] } },
          { fuelType: { $in: [null, ''] } },
          { transmission: { $in: [null, ''] } }
        ]
      }).select('_id make model color fuelType transmission bodyType year registrationNumber');

      if (vehiclesWithMissingData.length === 0) {
        console.log('✅ All active vehicles have complete filter data!');
      } else {
        console.log(`⚠️  Found ${vehiclesWithMissingData.length} active vehicles with missing filter data:\n`);
        
        vehiclesWithMissingData.slice(0, 10).forEach((vehicle, index) => {
          console.log(`Vehicle ${index + 1} (ID: ${vehicle._id}):`);
          console.log(`  - Make: ${vehicle.make || '❌ MISSING'}`);
          console.log(`  - Model: ${vehicle.model || '❌ MISSING'}`);
          console.log(`  - Color: ${vehicle.color || '❌ MISSING'}`);
          console.log(`  - Fuel Type: ${vehicle.fuelType || '❌ MISSING'}`);
          console.log(`  - Transmission: ${vehicle.transmission || '❌ MISSING'}`);
          console.log(`  - Body Type: ${vehicle.bodyType || '(optional)'}`);
          console.log(`  - Year: ${vehicle.year || '❌ MISSING'}`);
          if (vehicle.registrationNumber) {
            console.log(`  - Registration: ${vehicle.registrationNumber}`);
          }
          console.log();
        });

        if (vehiclesWithMissingData.length > 10) {
          console.log(`... and ${vehiclesWithMissingData.length - 10} more\n`);
        }

        console.log('💡 Solution: Populate missing fields or remove incomplete vehicles.');
      }
      console.log();

      // Step 4: Sample vehicle data
      console.log('📍 STEP 4: Sample Vehicle Data');
      console.log('-'.repeat(80));
      console.log();

      const sampleVehicles = await Car.find({ advertStatus: 'active' })
        .limit(3)
        .select('make model color fuelType transmission bodyType year price mileage advertStatus');

      if (sampleVehicles.length > 0) {
        sampleVehicles.forEach((vehicle, index) => {
          console.log(`Sample Vehicle ${index + 1}:`);
          console.log(`  Make: ${vehicle.make}`);
          console.log(`  Model: ${vehicle.model}`);
          console.log(`  Color: ${vehicle.color}`);
          console.log(`  Fuel Type: ${vehicle.fuelType}`);
          console.log(`  Transmission: ${vehicle.transmission}`);
          console.log(`  Body Type: ${vehicle.bodyType || 'N/A'}`);
          console.log(`  Year: ${vehicle.year}`);
          console.log(`  Price: £${vehicle.price?.toLocaleString() || 'N/A'}`);
          console.log(`  Mileage: ${vehicle.mileage?.toLocaleString() || 'N/A'} miles`);
          console.log(`  Status: ${vehicle.advertStatus}`);
          console.log();
        });
      }

      // Step 5: Data quality checks
      console.log('📍 STEP 5: Data Quality Checks');
      console.log('-'.repeat(80));
      console.log();

      // Check for duplicate values (case sensitivity issues)
      const makes = await Car.distinct('make', { advertStatus: 'active' });
      const makesLower = makes.map(m => m?.toLowerCase()).filter(Boolean);
      const duplicateMakes = makesLower.length !== new Set(makesLower).size;
      
      if (duplicateMakes) {
        console.log('⚠️  Potential case sensitivity issues in makes');
        console.log('   (e.g., "BMW" vs "bmw")');
      } else {
        console.log('✅ No case sensitivity issues detected in makes');
      }

      // Check for null values in required fields
      const nullMakes = await Car.countDocuments({ advertStatus: 'active', make: null });
      const nullModels = await Car.countDocuments({ advertStatus: 'active', model: null });
      const nullColors = await Car.countDocuments({ advertStatus: 'active', color: null });
      
      if (nullMakes > 0 || nullModels > 0 || nullColors > 0) {
        console.log('⚠️  Null values found in required fields:');
        if (nullMakes > 0) console.log(`   - Make: ${nullMakes} vehicles`);
        if (nullModels > 0) console.log(`   - Model: ${nullModels} vehicles`);
        if (nullColors > 0) console.log(`   - Color: ${nullColors} vehicles`);
      } else {
        console.log('✅ No null values in required fields');
      }

      // Check year range
      const years = await Car.aggregate([
        { $match: { advertStatus: 'active' } },
        { $group: { _id: null, minYear: { $min: '$year' }, maxYear: { $max: '$year' } } }
      ]);
      
      if (years.length > 0) {
        console.log(`✅ Year range: ${years[0].minYear} - ${years[0].maxYear}`);
      }
      
      console.log();

    } else {
      console.log('⏭️  Skipping field checks (no active vehicles)');
      console.log();
    }

    // Step 6: Summary and recommendations
    console.log('📍 STEP 6: Summary & Recommendations');
    console.log('-'.repeat(80));
    console.log();

    if (activeCount === 0) {
      console.log('❌ CRITICAL: No active vehicles in database');
      console.log();
      console.log('📋 Action Required:');
      console.log('   1. Run: node backend/scripts/activateAllCars.js');
      console.log('   2. Or manually set advertStatus to "active" for vehicles');
      console.log();
    } else {
      // Calculate completeness score
      const requiredFields = ['make', 'model', 'color', 'fuelType', 'transmission'];
      let totalScore = 0;
      
      for (const field of requiredFields) {
        const query = { advertStatus: 'active' };
        query[field] = { $exists: true, $ne: null, $ne: '' };
        const count = await Car.countDocuments(query);
        totalScore += (count / activeCount) * 100;
      }
      
      const avgScore = (totalScore / requiredFields.length).toFixed(1);
      
      console.log(`📊 Data Completeness Score: ${avgScore}%`);
      console.log();
      
      if (avgScore >= 90) {
        console.log('✅ EXCELLENT: Filter data is well-populated');
        console.log('   FilterSidebar should work correctly');
      } else if (avgScore >= 70) {
        console.log('⚠️  GOOD: Most filter data is populated');
        console.log('   Some filter options may be limited');
      } else if (avgScore >= 50) {
        console.log('⚠️  FAIR: Significant missing filter data');
        console.log('   Many filter options will be limited');
      } else {
        console.log('❌ POOR: Most filter data is missing');
        console.log('   FilterSidebar will have very limited options');
      }
      console.log();
      
      if (avgScore < 90) {
        console.log('💡 Recommendations:');
        console.log('   - Populate missing filter fields on existing vehicles');
        console.log('   - Consider running data migration scripts');
        console.log('   - Ensure new vehicles have all required fields');
        console.log();
      }
    }

    console.log('='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run verification
verifyFilterData();
