/**
 * Diagnose API Data Save Issue
 * 
 * This script checks why API data is not being saved to database
 * for specific cars: GO14BLU and BN67OSJ
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function diagnoseAPISaveIssue() {
  try {
    console.log('\n🔍 DIAGNOSING API DATA SAVE ISSUE\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const testVRMs = ['GO14BLU', 'BN67OSJ'];
    
    for (const vrm of testVRMs) {
      console.log('\n' + '='.repeat(60));
      console.log(`\n🚗 TESTING: ${vrm}\n`);
      
      // Step 1: Check if car exists in database
      console.log('📊 STEP 1: Checking database...');
      const existingCar = await Car.findOne({ registrationNumber: vrm });
      
      if (existingCar) {
        console.log(`✅ Car found in database: ${existingCar._id}`);
        console.log(`   Make: ${existingCar.make}`);
        console.log(`   Model: ${existingCar.model}`);
        console.log(`   Variant: ${existingCar.variant || 'NULL'}`);
        console.log(`   Color: ${existingCar.color || 'NULL'}`);
        console.log(`   Engine Size: ${existingCar.engineSize || 'NULL'}`);
        console.log(`   Body Type: ${existingCar.bodyType || 'NULL'}`);
        console.log(`   Transmission: ${existingCar.transmission || 'NULL'}`);
        console.log(`   Fuel Type: ${existingCar.fuelType || 'NULL'}`);
        console.log(`   Year: ${existingCar.year || 'NULL'}`);
        console.log(`   Doors: ${existingCar.doors || 'NULL'}`);
        console.log(`   Seats: ${existingCar.seats || 'NULL'}`);
        console.log(`   CO2: ${existingCar.co2Emissions || 'NULL'}`);
        console.log(`   Annual Tax: ${existingCar.annualTax || 'NULL'}`);
        console.log(`   Insurance Group: ${existingCar.insuranceGroup || 'NULL'}`);
        console.log(`   Urban MPG: ${existingCar.fuelEconomyUrban || existingCar.urbanMpg || 'NULL'}`);
        console.log(`   Combined MPG: ${existingCar.fuelEconomyCombined || existingCar.combinedMpg || 'NULL'}`);
        console.log(`   Electric Range: ${existingCar.electricRange || existingCar.runningCosts?.electricRange || 'NULL'}`);
        console.log(`   Battery Capacity: ${existingCar.batteryCapacity || existingCar.runningCosts?.batteryCapacity || 'NULL'}`);
      } else {
        console.log(`❌ Car NOT found in database`);
      }
      
      // Step 2: Fetch data from API
      console.log(`\n📡 STEP 2: Fetching data from CheckCarDetails API...`);
      
      const checkCarClient = new CheckCarDetailsClient();
      
      try {
        const rawData = await checkCarClient.getUKVehicleData(vrm);
        console.log(`✅ API Response received`);
        
        // Parse the response
        const parsedData = checkCarClient.parseResponse(rawData);
        
        console.log(`\n📋 PARSED API DATA:`);
        console.log(`   Make: ${parsedData.make || 'NULL'}`);
        console.log(`   Model: ${parsedData.model || 'NULL'}`);
        console.log(`   Variant: ${parsedData.variant || 'NULL'}`);
        console.log(`   Color: ${parsedData.color || 'NULL'}`);
        console.log(`   Engine Size: ${parsedData.engineSize || 'NULL'}`);
        console.log(`   Body Type: ${parsedData.bodyType || 'NULL'}`);
        console.log(`   Transmission: ${parsedData.transmission || 'NULL'}`);
        console.log(`   Fuel Type: ${parsedData.fuelType || 'NULL'}`);
        console.log(`   Year: ${parsedData.year || 'NULL'}`);
        console.log(`   Doors: ${parsedData.doors || 'NULL'}`);
        console.log(`   Seats: ${parsedData.seats || 'NULL'}`);
        console.log(`   CO2: ${parsedData.co2Emissions || 'NULL'}`);
        console.log(`   Annual Tax: ${parsedData.annualTax || 'NULL'}`);
        console.log(`   Insurance Group: ${parsedData.insuranceGroup || 'NULL'}`);
        console.log(`   Urban MPG: ${parsedData.urbanMpg || 'NULL'}`);
        console.log(`   Combined MPG: ${parsedData.combinedMpg || 'NULL'}`);
        console.log(`   Electric Range: ${parsedData.electricRange || 'NULL'}`);
        console.log(`   Battery Capacity: ${parsedData.batteryCapacity || 'NULL'}`);
        
        // Step 3: Compare database vs API
        if (existingCar) {
          console.log(`\n🔍 STEP 3: Comparing database vs API data...`);
          
          const missingFields = [];
          const nullFields = [];
          
          // Check each field
          const fieldsToCheck = [
            'make', 'model', 'variant', 'color', 'engineSize', 
            'bodyType', 'transmission', 'fuelType', 'year', 
            'doors', 'seats', 'co2Emissions', 'annualTax', 
            'insuranceGroup', 'urbanMpg', 'combinedMpg',
            'electricRange', 'batteryCapacity'
          ];
          
          for (const field of fieldsToCheck) {
            const dbValue = existingCar[field] || existingCar.runningCosts?.[field];
            const apiValue = parsedData[field];
            
            if (!dbValue && apiValue) {
              missingFields.push({
                field,
                dbValue: dbValue || 'NULL',
                apiValue: apiValue
              });
            }
            
            if (!apiValue) {
              nullFields.push(field);
            }
          }
          
          if (missingFields.length > 0) {
            console.log(`\n⚠️  MISSING FIELDS IN DATABASE (but available in API):`);
            missingFields.forEach(({ field, dbValue, apiValue }) => {
              console.log(`   ${field}: DB="${dbValue}" → API="${apiValue}"`);
            });
          } else {
            console.log(`\n✅ All API fields are present in database`);
          }
          
          if (nullFields.length > 0) {
            console.log(`\n⚠️  NULL FIELDS IN API (not available from API):`);
            nullFields.forEach(field => {
              console.log(`   ${field}: NULL`);
            });
          }
          
          // Step 4: Try to update the car with API data
          console.log(`\n💾 STEP 4: Attempting to update car with API data...`);
          
          let updated = false;
          const updates = {};
          
          // Update missing fields
          for (const { field, apiValue } of missingFields) {
            if (apiValue !== null && apiValue !== undefined) {
              updates[field] = apiValue;
              updated = true;
            }
          }
          
          if (updated) {
            console.log(`\n📝 Updating ${Object.keys(updates).length} fields...`);
            Object.keys(updates).forEach(key => {
              console.log(`   ${key}: ${updates[key]}`);
            });
            
            // Apply updates
            Object.assign(existingCar, updates);
            
            try {
              await existingCar.save();
              console.log(`\n✅ Car updated successfully!`);
              
              // Verify the update
              const verifiedCar = await Car.findOne({ registrationNumber: vrm });
              console.log(`\n✅ VERIFICATION - Updated fields:`);
              Object.keys(updates).forEach(key => {
                console.log(`   ${key}: ${verifiedCar[key]}`);
              });
            } catch (saveError) {
              console.error(`\n❌ SAVE ERROR:`, saveError.message);
              console.error(`   Error name: ${saveError.name}`);
              console.error(`   Error code: ${saveError.code}`);
              
              if (saveError.errors) {
                console.error(`\n   Validation errors:`);
                Object.keys(saveError.errors).forEach(key => {
                  console.error(`     ${key}: ${saveError.errors[key].message}`);
                });
              }
            }
          } else {
            console.log(`\n✅ No updates needed - all data is already in database`);
          }
        } else {
          // Step 4: Create new car with API data
          console.log(`\n💾 STEP 4: Creating new car with API data...`);
          
          try {
            const newCar = new Car({
              registrationNumber: vrm,
              make: parsedData.make || 'Unknown',
              model: parsedData.model || 'Unknown',
              variant: parsedData.variant,
              color: parsedData.color,
              engineSize: parsedData.engineSize,
              bodyType: parsedData.bodyType,
              transmission: parsedData.transmission || 'manual',
              fuelType: parsedData.fuelType || 'Petrol',
              year: parsedData.year || new Date().getFullYear(),
              mileage: 50000, // Default mileage
              doors: parsedData.doors,
              seats: parsedData.seats,
              co2Emissions: parsedData.co2Emissions,
              annualTax: parsedData.annualTax,
              insuranceGroup: parsedData.insuranceGroup,
              fuelEconomyUrban: parsedData.urbanMpg,
              fuelEconomyCombined: parsedData.combinedMpg,
              electricRange: parsedData.electricRange,
              batteryCapacity: parsedData.batteryCapacity,
              price: 10000, // Default price
              description: 'Test car created by diagnostic script',
              postcode: 'M1 1AA', // Default postcode
              dataSource: 'DVLA',
              advertStatus: 'active'
            });
            
            await newCar.save();
            console.log(`\n✅ New car created successfully!`);
            console.log(`   Car ID: ${newCar._id}`);
            console.log(`   Make: ${newCar.make}`);
            console.log(`   Model: ${newCar.model}`);
            console.log(`   Variant: ${newCar.variant}`);
            
          } catch (createError) {
            console.error(`\n❌ CREATE ERROR:`, createError.message);
            console.error(`   Error name: ${createError.name}`);
            console.error(`   Error code: ${createError.code}`);
            
            if (createError.errors) {
              console.error(`\n   Validation errors:`);
              Object.keys(createError.errors).forEach(key => {
                console.error(`     ${key}: ${createError.errors[key].message}`);
              });
            }
          }
        }
        
      } catch (apiError) {
        console.error(`\n❌ API ERROR:`, apiError.message);
        console.error(`   Error details:`, apiError.details || 'No details');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DIAGNOSIS COMPLETE\n');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database\n');
  }
}

// Run the diagnosis
diagnoseAPISaveIssue();
