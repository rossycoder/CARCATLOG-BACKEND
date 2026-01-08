require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Car = require('../models/Car');

/**
 * Comprehensive diagnostic script to test the filter-options API endpoint
 * This script tests both local and production endpoints, and verifies database state
 */

async function testFilterOptionsAPI() {
  console.log('='.repeat(80));
  console.log('🔍 FILTER OPTIONS API DIAGNOSTIC SCRIPT');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Test Local Endpoint
  console.log('📍 STEP 1: Testing Local Endpoint');
  console.log('-'.repeat(80));
  await testEndpoint('http://localhost:5000/api/vehicles/filter-options', 'Local');
  console.log();

  // Step 2: Test Production Endpoint
  console.log('📍 STEP 2: Testing Production Endpoint');
  console.log('-'.repeat(80));
  await testEndpoint('https://carcatlog-backend-1.onrender.com/api/vehicles/filter-options', 'Production');
  console.log();

  // Step 3: Direct Database Query
  console.log('📍 STEP 3: Direct Database Query');
  console.log('-'.repeat(80));
  await testDatabaseDirectly();
  console.log();

  console.log('='.repeat(80));
  console.log('✅ DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
  
  process.exit(0);
}

/**
 * Test a specific endpoint
 */
async function testEndpoint(url, label) {
  try {
    console.log(`Testing ${label} endpoint: ${url}`);
    console.log();

    const startTime = Date.now();
    const response = await axios.get(url, { timeout: 10000 });
    const duration = Date.now() - startTime;

    console.log(`✅ ${label} endpoint responded successfully`);
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log();

    // Verify response structure
    console.log('📦 Response Structure:');
    console.log(`   - Has 'success' field: ${response.data.hasOwnProperty('success')}`);
    console.log(`   - Success value: ${response.data.success}`);
    console.log(`   - Has 'data' field: ${response.data.hasOwnProperty('data')}`);
    console.log();

    if (response.data.data) {
      const data = response.data.data;
      
      console.log('📊 Filter Options Summary:');
      console.log(`   - Makes: ${data.makes?.length || 0} options`);
      console.log(`   - Models: ${data.models?.length || 0} options`);
      console.log(`   - Fuel Types: ${data.fuelTypes?.length || 0} options`);
      console.log(`   - Transmissions: ${data.transmissions?.length || 0} options`);
      console.log(`   - Body Types: ${data.bodyTypes?.length || 0} options`);
      console.log(`   - Colours: ${data.colours?.length || 0} options`);
      console.log(`   - Year Range: ${data.yearRange?.min || 'N/A'} - ${data.yearRange?.max || 'N/A'}`);
      console.log();

      // Show sample data
      if (data.makes?.length > 0) {
        console.log('🔍 Sample Makes:', data.makes.slice(0, 5).join(', '));
      }
      if (data.models?.length > 0) {
        console.log('🔍 Sample Models:', data.models.slice(0, 5).join(', '));
      }
      if (data.colours?.length > 0) {
        console.log('🔍 Sample Colours:', data.colours.slice(0, 5).join(', '));
      }
      if (data.fuelTypes?.length > 0) {
        console.log('🔍 Fuel Types:', data.fuelTypes.join(', '));
      }
      if (data.transmissions?.length > 0) {
        console.log('🔍 Transmissions:', data.transmissions.join(', '));
      }
      console.log();

      // Check for empty arrays
      const emptyFields = [];
      if (!data.makes || data.makes.length === 0) emptyFields.push('makes');
      if (!data.models || data.models.length === 0) emptyFields.push('models');
      if (!data.colours || data.colours.length === 0) emptyFields.push('colours');
      if (!data.fuelTypes || data.fuelTypes.length === 0) emptyFields.push('fuelTypes');
      if (!data.transmissions || data.transmissions.length === 0) emptyFields.push('transmissions');
      if (!data.bodyTypes || data.bodyTypes.length === 0) emptyFields.push('bodyTypes');

      if (emptyFields.length > 0) {
        console.log('⚠️  WARNING: Empty filter fields detected:');
        emptyFields.forEach(field => console.log(`   - ${field}`));
        console.log();
      }

      // Full response for debugging
      console.log('📄 Full Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log();

    } else {
      console.log('❌ ERROR: Response does not contain "data" field');
      console.log('📄 Full Response:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log();
    }

  } catch (error) {
    console.log(`❌ ${label} endpoint failed`);
    console.log();
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Connection refused - server may not be running');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏱️  Request timed out');
    } else if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📄 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`💥 Error: ${error.message}`);
    }
    console.log();
  }
}

/**
 * Query database directly to verify data exists
 */
async function testDatabaseDirectly() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log();

    // Count total vehicles
    const totalVehicles = await Car.countDocuments();
    console.log(`📊 Total vehicles in database: ${totalVehicles}`);

    // Count active vehicles
    const activeVehicles = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`✅ Active vehicles: ${activeVehicles}`);
    console.log();

    if (activeVehicles === 0) {
      console.log('⚠️  WARNING: No active vehicles found in database!');
      console.log('   This is why filter options are empty.');
      console.log();
      
      // Check other statuses
      const statuses = await Car.aggregate([
        { $group: { _id: '$advertStatus', count: { $sum: 1 } } }
      ]);
      console.log('📊 Vehicles by status:');
      statuses.forEach(s => console.log(`   - ${s._id}: ${s.count}`));
      console.log();
    } else {
      // Query distinct values directly
      console.log('🔍 Querying distinct values from active vehicles:');
      
      const makes = await Car.distinct('make', { advertStatus: 'active' });
      console.log(`   - Makes: ${makes.length} (${makes.filter(Boolean).length} non-null)`);
      
      const models = await Car.distinct('model', { advertStatus: 'active' });
      console.log(`   - Models: ${models.length} (${models.filter(Boolean).length} non-null)`);
      
      const colors = await Car.distinct('color', { advertStatus: 'active' });
      console.log(`   - Colors: ${colors.length} (${colors.filter(Boolean).length} non-null)`);
      
      const fuelTypes = await Car.distinct('fuelType', { advertStatus: 'active' });
      console.log(`   - Fuel Types: ${fuelTypes.length} (${fuelTypes.filter(Boolean).length} non-null)`);
      
      const transmissions = await Car.distinct('transmission', { advertStatus: 'active' });
      console.log(`   - Transmissions: ${transmissions.length} (${transmissions.filter(Boolean).length} non-null)`);
      
      const bodyTypes = await Car.distinct('bodyType', { advertStatus: 'active' });
      console.log(`   - Body Types: ${bodyTypes.length} (${bodyTypes.filter(Boolean).length} non-null)`);
      console.log();

      // Show sample values
      if (makes.filter(Boolean).length > 0) {
        console.log('🔍 Sample Makes:', makes.filter(Boolean).slice(0, 5).join(', '));
      }
      if (colors.filter(Boolean).length > 0) {
        console.log('🔍 Sample Colors:', colors.filter(Boolean).slice(0, 5).join(', '));
      }
      if (fuelTypes.filter(Boolean).length > 0) {
        console.log('🔍 Fuel Types:', fuelTypes.filter(Boolean).join(', '));
      }
      if (transmissions.filter(Boolean).length > 0) {
        console.log('🔍 Transmissions:', transmissions.filter(Boolean).join(', '));
      }
      console.log();

      // Check for null values
      const nullChecks = [
        { field: 'make', count: makes.filter(v => !v).length },
        { field: 'model', count: models.filter(v => !v).length },
        { field: 'color', count: colors.filter(v => !v).length },
        { field: 'fuelType', count: fuelTypes.filter(v => !v).length },
        { field: 'transmission', count: transmissions.filter(v => !v).length },
        { field: 'bodyType', count: bodyTypes.filter(v => !v).length }
      ];

      const fieldsWithNulls = nullChecks.filter(c => c.count > 0);
      if (fieldsWithNulls.length > 0) {
        console.log('⚠️  Fields with null/undefined values:');
        fieldsWithNulls.forEach(f => console.log(`   - ${f.field}: ${f.count} null values`));
        console.log();
      }

      // Sample a few vehicles to check data quality
      console.log('📋 Sample Vehicle Data:');
      const sampleVehicles = await Car.find({ advertStatus: 'active' })
        .limit(3)
        .select('make model color fuelType transmission bodyType year advertStatus');
      
      sampleVehicles.forEach((vehicle, index) => {
        console.log(`\n   Vehicle ${index + 1}:`);
        console.log(`   - Make: ${vehicle.make || 'NULL'}`);
        console.log(`   - Model: ${vehicle.model || 'NULL'}`);
        console.log(`   - Color: ${vehicle.color || 'NULL'}`);
        console.log(`   - Fuel Type: ${vehicle.fuelType || 'NULL'}`);
        console.log(`   - Transmission: ${vehicle.transmission || 'NULL'}`);
        console.log(`   - Body Type: ${vehicle.bodyType || 'NULL'}`);
        console.log(`   - Year: ${vehicle.year || 'NULL'}`);
        console.log(`   - Status: ${vehicle.advertStatus}`);
      });
      console.log();
    }

    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('❌ Database query failed:', error.message);
    console.error(error);
  }
}

// Run the diagnostic
testFilterOptionsAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
