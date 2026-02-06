/**
 * Fix Specific Car Data - Fix the car with missing variant, doors, seats
 * Car ID: 6985f07d4b37080dccab7fb1
 * URL: https://carcatlog.vercel.app/cars/6985f07d4b37080dccab7fb1
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fixSpecificCarData() {
  try {
    console.log('🔧 Fixing Specific Car Data...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const carId = '6985f07d4b37080dccab7fb1';
    
    console.log(`🚗 Fixing Car ID: ${carId}`);
    console.log('=' .repeat(50));

    // 1. Find the car in database
    console.log('\n1️⃣ FINDING CAR IN DATABASE:');
    console.log('-'.repeat(35));
    
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found in database');
      return;
    }
    
    console.log('✅ Car found:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Variant: ${car.variant || 'MISSING'}`);
    console.log(`   Doors: ${car.doors || 'MISSING'}`);
    console.log(`   Seats: ${car.seats || 'MISSING'}`);
    console.log(`   Body Type: ${car.bodyType || 'MISSING'}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Mileage: ${car.mileage}`);

    // 2. Fetch fresh data from API
    console.log('\n2️⃣ FETCHING FRESH API DATA:');
    console.log('-'.repeat(35));
    
    const vrm = car.registrationNumber;
    
    try {
      const freshData = await checkCarDetailsClient.getVehicleData(vrm);
      console.log('✅ Fresh API data retrieved:');
      console.log(`   Make/Model: ${freshData.make} ${freshData.model}`);
      console.log(`   Variant: ${freshData.variant || 'Not available'}`);
      console.log(`   Doors: ${freshData.doors || 'Not available'}`);
      console.log(`   Seats: ${freshData.seats || 'Not available'}`);
      console.log(`   Body Type: ${freshData.bodyType || 'Not available'}`);
      console.log(`   Color: ${freshData.color || 'Not available'}`);
      console.log(`   Engine Size: ${freshData.engineSize || 'Not available'}L`);
      console.log(`   Transmission: ${freshData.transmission || 'Not available'}`);
      
      // 3. Update car with missing data
      console.log('\n3️⃣ UPDATING CAR WITH MISSING DATA:');
      console.log('-'.repeat(40));
      
      let updated = false;
      
      // Update variant
      if (freshData.variant && (!car.variant || car.variant === 'Unknown' || car.variant === null)) {
        console.log(`🔄 Updating variant: "${car.variant}" → "${freshData.variant}"`);
        car.variant = freshData.variant;
        updated = true;
      }
      
      // Update doors
      if (freshData.doors && (!car.doors || car.doors === null)) {
        console.log(`🔄 Updating doors: ${car.doors} → ${freshData.doors}`);
        car.doors = freshData.doors;
        updated = true;
      }
      
      // Update seats
      if (freshData.seats && (!car.seats || car.seats === null)) {
        console.log(`🔄 Updating seats: ${car.seats} → ${freshData.seats}`);
        car.seats = freshData.seats;
        updated = true;
      }
      
      // Update body type
      if (freshData.bodyType && (!car.bodyType || car.bodyType === 'Unknown' || car.bodyType === null)) {
        console.log(`🔄 Updating body type: "${car.bodyType}" → "${freshData.bodyType}"`);
        car.bodyType = freshData.bodyType;
        updated = true;
      }
      
      // Update color if better
      if (freshData.color && (!car.color || car.color === 'Unknown' || car.color === null)) {
        console.log(`🔄 Updating color: "${car.color}" → "${freshData.color}"`);
        car.color = freshData.color;
        updated = true;
      }
      
      // Update engine size
      if (freshData.engineSize && (!car.engineSize || car.engineSize === null)) {
        console.log(`🔄 Updating engine size: ${car.engineSize} → ${freshData.engineSize}L`);
        car.engineSize = freshData.engineSize;
        updated = true;
      }
      
      // Update transmission
      if (freshData.transmission && (!car.transmission || car.transmission === 'Unknown' || car.transmission === null)) {
        console.log(`🔄 Updating transmission: "${car.transmission}" → "${freshData.transmission}"`);
        car.transmission = freshData.transmission.toLowerCase();
        updated = true;
      }
      
      // Update running costs if missing
      if (freshData.fuelEconomy) {
        if (!car.fuelEconomyUrban && freshData.fuelEconomy.urban) {
          console.log(`🔄 Adding urban MPG: ${freshData.fuelEconomy.urban}`);
          car.fuelEconomyUrban = freshData.fuelEconomy.urban;
          updated = true;
        }
        if (!car.fuelEconomyExtraUrban && freshData.fuelEconomy.extraUrban) {
          console.log(`🔄 Adding extra urban MPG: ${freshData.fuelEconomy.extraUrban}`);
          car.fuelEconomyExtraUrban = freshData.fuelEconomy.extraUrban;
          updated = true;
        }
        if (!car.fuelEconomyCombined && freshData.fuelEconomy.combined) {
          console.log(`🔄 Adding combined MPG: ${freshData.fuelEconomy.combined}`);
          car.fuelEconomyCombined = freshData.fuelEconomy.combined;
          updated = true;
        }
        
        // Update runningCosts object
        if (!car.runningCosts) car.runningCosts = {};
        if (!car.runningCosts.fuelEconomy) car.runningCosts.fuelEconomy = {};
        
        if (freshData.fuelEconomy.urban) car.runningCosts.fuelEconomy.urban = freshData.fuelEconomy.urban;
        if (freshData.fuelEconomy.extraUrban) car.runningCosts.fuelEconomy.extraUrban = freshData.fuelEconomy.extraUrban;
        if (freshData.fuelEconomy.combined) car.runningCosts.fuelEconomy.combined = freshData.fuelEconomy.combined;
      }
      
      // Update CO2 and tax
      if (freshData.co2Emissions && (!car.co2Emissions || car.co2Emissions === null)) {
        console.log(`🔄 Adding CO2 emissions: ${freshData.co2Emissions}g/km`);
        car.co2Emissions = freshData.co2Emissions;
        updated = true;
      }
      
      if (freshData.annualTax && (!car.annualTax || car.annualTax === null)) {
        console.log(`🔄 Adding annual tax: £${freshData.annualTax}`);
        car.annualTax = freshData.annualTax;
        if (!car.runningCosts) car.runningCosts = {};
        car.runningCosts.annualTax = freshData.annualTax;
        updated = true;
      }
      
      // Update display title if needed
      if (car.variant && car.engineSize) {
        const newDisplayTitle = `${car.engineSize} ${car.variant}`;
        if (car.displayTitle !== newDisplayTitle) {
          console.log(`🔄 Updating display title: "${car.displayTitle}" → "${newDisplayTitle}"`);
          car.displayTitle = newDisplayTitle;
          updated = true;
        }
      }
      
      // 4. Save the updated car
      if (updated) {
        console.log('\n4️⃣ SAVING UPDATED CAR:');
        console.log('-'.repeat(25));
        
        await car.save();
        console.log('✅ Car updated and saved successfully');
        
        // Show final result
        console.log('\n📊 FINAL CAR DATA:');
        console.log(`   Registration: ${car.registrationNumber}`);
        console.log(`   Make/Model: ${car.make} ${car.model}`);
        console.log(`   Variant: ${car.variant}`);
        console.log(`   Doors: ${car.doors}`);
        console.log(`   Seats: ${car.seats}`);
        console.log(`   Body Type: ${car.bodyType}`);
        console.log(`   Color: ${car.color}`);
        console.log(`   Engine Size: ${car.engineSize}L`);
        console.log(`   Transmission: ${car.transmission}`);
        console.log(`   Display Title: ${car.displayTitle}`);
        console.log(`   Urban MPG: ${car.fuelEconomyUrban || 'N/A'}`);
        console.log(`   Combined MPG: ${car.fuelEconomyCombined || 'N/A'}`);
        console.log(`   CO2 Emissions: ${car.co2Emissions || 'N/A'}g/km`);
        console.log(`   Annual Tax: £${car.annualTax || 'N/A'}`);
        
      } else {
        console.log('\n4️⃣ NO UPDATES NEEDED:');
        console.log('-'.repeat(25));
        console.log('✅ Car already has all available data');
      }
      
    } catch (apiError) {
      console.log(`❌ API Error: ${apiError.message}`);
      
      // Try to get data from comprehensive service
      console.log('\n🔄 Trying comprehensive service...');
      try {
        const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');
        const comprehensiveService = new ComprehensiveVehicleService();
        
        const comprehensiveResult = await comprehensiveService.fetchCompleteVehicleData(
          vrm, 
          car.mileage, 
          false
        );
        
        if (comprehensiveResult.vehicleData) {
          console.log('✅ Got data from comprehensive service');
          const vehicleData = comprehensiveResult.vehicleData;
          
          let updated = false;
          
          // Update missing fields
          if (vehicleData.variant && !car.variant) {
            car.variant = vehicleData.variant;
            updated = true;
          }
          if (vehicleData.doors && !car.doors) {
            car.doors = vehicleData.doors;
            updated = true;
          }
          if (vehicleData.seats && !car.seats) {
            car.seats = vehicleData.seats;
            updated = true;
          }
          if (vehicleData.bodyType && !car.bodyType) {
            car.bodyType = vehicleData.bodyType;
            updated = true;
          }
          
          if (updated) {
            await car.save();
            console.log('✅ Car updated with comprehensive service data');
          }
        }
      } catch (compError) {
        console.log(`❌ Comprehensive service also failed: ${compError.message}`);
      }
    }

    // 5. Check if we need to fetch MOT data for mileage
    console.log('\n5️⃣ CHECKING MOT DATA FOR MILEAGE:');
    console.log('-'.repeat(40));
    
    try {
      const motData = await checkCarDetailsClient.getMOTHistory(vrm);
      
      if (motData.motHistory && motData.motHistory.length > 0) {
        const latestMOT = motData.motHistory[0];
        const motMileage = parseInt(latestMOT.odometerValue);
        
        console.log(`📊 Latest MOT mileage: ${motMileage.toLocaleString()} miles`);
        console.log(`📊 Current car mileage: ${car.mileage.toLocaleString()} miles`);
        
        if (motMileage > car.mileage) {
          console.log(`🔄 Updating mileage: ${car.mileage.toLocaleString()} → ${motMileage.toLocaleString()}`);
          car.mileage = motMileage;
          
          // Update MOT status and expiry
          car.motStatus = latestMOT.testResult === 'PASSED' ? 'Valid' : 'Invalid';
          if (latestMOT.expiryDate) {
            car.motExpiry = new Date(latestMOT.expiryDate);
            car.motDue = new Date(latestMOT.expiryDate);
          }
          
          await car.save();
          console.log('✅ Updated mileage and MOT data');
        } else {
          console.log('✅ Mileage is already up to date');
        }
      }
    } catch (motError) {
      console.log(`⚠️  Could not fetch MOT data: ${motError.message}`);
    }

    console.log('\n6️⃣ SUMMARY:');
    console.log('-'.repeat(15));
    console.log('✅ Car data has been updated with available information');
    console.log('✅ Missing fields have been filled where possible');
    console.log('✅ Car should now display correctly on frontend');
    console.log(`✅ Check: https://carcatlog.vercel.app/cars/${carId}`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  fixSpecificCarData();
}

module.exports = { fixSpecificCarData };