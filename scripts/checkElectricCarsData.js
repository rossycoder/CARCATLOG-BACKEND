/**
 * Check Electric Cars Data
 * 
 * Check why GO14BLU and BN67OSJ data is not saving properly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkElectricCarsData() {
  try {
    console.log('\n🔍 CHECKING ELECTRIC CARS DATA\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const testVRMs = ['GO14BLU', 'BN67OSJ'];
    
    for (const vrm of testVRMs) {
      console.log('\n' + '='.repeat(60));
      console.log(`\n🚗 CHECKING: ${vrm}\n`);
      
      // Find car in database
      const car = await Car.findOne({ registrationNumber: vrm });
      
      if (car) {
        console.log(`✅ Car found in database: ${car._id}`);
        console.log(`\n📊 DATABASE DATA:`);
        console.log(`   Make: ${car.make || 'NULL'}`);
        console.log(`   Model: ${car.model || 'NULL'}`);
        console.log(`   Variant: ${car.variant || 'NULL'}`);
        console.log(`   Color: ${car.color || 'NULL'}`);
        console.log(`   Engine Size: ${car.engineSize || 'NULL'}`);
        console.log(`   Body Type: ${car.bodyType || 'NULL'}`);
        console.log(`   Transmission: ${car.transmission || 'NULL'}`);
        console.log(`   Fuel Type: ${car.fuelType || 'NULL'}`);
        console.log(`   Year: ${car.year || 'NULL'}`);
        console.log(`   Doors: ${car.doors || 'NULL'}`);
        console.log(`   Seats: ${car.seats || 'NULL'}`);
        console.log(`   CO2: ${car.co2Emissions || 'NULL'}`);
        console.log(`   Annual Tax: ${car.annualTax || 'NULL'}`);
        console.log(`   Insurance Group: ${car.insuranceGroup || 'NULL'}`);
        console.log(`   Emission Class: ${car.emissionClass || 'NULL'}`);
        console.log(`   Gearbox: ${car.gearbox || 'NULL'}`);
        console.log(`   Number of Previous Keepers: ${car.numberOfPreviousKeepers || 'NULL'}`);
        
        console.log(`\n🔋 ELECTRIC VEHICLE DATA:`);
        console.log(`   Electric Range: ${car.electricRange || car.runningCosts?.electricRange || 'NULL'}`);
        console.log(`   Battery Capacity: ${car.batteryCapacity || car.runningCosts?.batteryCapacity || 'NULL'}`);
        console.log(`   Charging Time: ${car.chargingTime || car.runningCosts?.chargingTime || 'NULL'}`);
        console.log(`   Home Charging Speed: ${car.homeChargingSpeed || car.runningCosts?.homeChargingSpeed || 'NULL'}`);
        console.log(`   Public Charging Speed: ${car.publicChargingSpeed || car.runningCosts?.publicChargingSpeed || 'NULL'}`);
        console.log(`   Rapid Charging Speed: ${car.rapidChargingSpeed || car.runningCosts?.rapidChargingSpeed || 'NULL'}`);
        
        console.log(`\n💰 RUNNING COSTS:`);
        console.log(`   Urban MPG: ${car.fuelEconomyUrban || car.urbanMpg || car.runningCosts?.fuelEconomy?.urban || 'NULL'}`);
        console.log(`   Extra Urban MPG: ${car.fuelEconomyExtraUrban || car.extraUrbanMpg || car.runningCosts?.fuelEconomy?.extraUrban || 'NULL'}`);
        console.log(`   Combined MPG: ${car.fuelEconomyCombined || car.combinedMpg || car.runningCosts?.fuelEconomy?.combined || 'NULL'}`);
        
        console.log(`\n📅 METADATA:`);
        console.log(`   Data Source: ${car.dataSource || 'NULL'}`);
        console.log(`   Data Sources (DVLA): ${car.dataSources?.dvla || false}`);
        console.log(`   Data Sources (CheckCarDetails): ${car.dataSources?.checkCarDetails || false}`);
        console.log(`   Created At: ${car.createdAt}`);
        console.log(`   Updated At: ${car.updatedAt}`);
        console.log(`   Advert Status: ${car.advertStatus}`);
        
        // Check for NULL fields
        const nullFields = [];
        const fieldsToCheck = [
          'variant', 'color', 'engineSize', 'bodyType', 'transmission',
          'doors', 'seats', 'co2Emissions', 'annualTax', 'insuranceGroup',
          'emissionClass', 'electricRange', 'batteryCapacity'
        ];
        
        for (const field of fieldsToCheck) {
          const value = car[field] || car.runningCosts?.[field];
          if (!value || value === null || value === 'null' || value === 'undefined') {
            nullFields.push(field);
          }
        }
        
        if (nullFields.length > 0) {
          console.log(`\n⚠️  NULL FIELDS (${nullFields.length}):`);
          nullFields.forEach(field => {
            console.log(`   - ${field}`);
          });
        } else {
          console.log(`\n✅ All fields have data!`);
        }
        
      } else {
        console.log(`❌ Car NOT found in database`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ CHECK COMPLETE\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database\n');
  }
}

// Run the check
checkElectricCarsData();
