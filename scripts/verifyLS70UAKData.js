/**
 * Verify LS70UAK Data - Show Complete CheckCarDetails Data
 * This script demonstrates the complete data available from CheckCarDetails API
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

const CAR_ID = '698682fd4c9aa2475ac2cb91';
const VRM = 'LS70UAK';

async function verifyData() {
  try {
    console.log('🔍 Verifying LS70UAK Data\n');
    console.log('=' .repeat(60));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Car record
    const car = await Car.findById(CAR_ID);
    if (!car) {
      console.error('❌ Car not found!');
      process.exit(1);
    }

    // Get VehicleHistory record
    const history = await VehicleHistory.getMostRecent(VRM);

    console.log('📋 CAR RECORD DATA (What frontend displays):');
    console.log('=' .repeat(60));
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Make: ${car.make}`);
    console.log(`Model: ${car.model}`);
    console.log(`Variant: ${car.variant || '❌ MISSING'}`);
    console.log(`Year: ${car.year}`);
    console.log(`Color: ${car.color}`);
    console.log(`Fuel Type: ${car.fuelType}`);
    console.log(`Transmission: ${car.transmission || '❌ MISSING'}`);
    console.log(`Engine Size: ${car.engineSize || '❌ MISSING'}L`);
    console.log(`Body Type: ${car.bodyType || '❌ MISSING'}`);
    console.log(`Doors: ${car.doors || '❌ MISSING'}`);
    console.log(`Seats: ${car.seats || '❌ MISSING'}`);
    console.log(`Emission Class: ${car.emissionClass || '❌ MISSING'}`);
    console.log(`\n💰 RUNNING COSTS:`);
    console.log(`Urban MPG: ${car.urbanMpg || '❌ MISSING'}`);
    console.log(`Extra Urban MPG: ${car.extraUrbanMpg || '❌ MISSING'}`);
    console.log(`Combined MPG: ${car.combinedMpg || '❌ MISSING'}`);
    console.log(`Annual Tax: £${car.annualTax || '❌ MISSING'}`);
    console.log(`Insurance Group: ${car.insuranceGroup || '❌ MISSING'}`);
    console.log(`CO2 Emissions: ${car.co2Emissions || '❌ MISSING'}g/km`);

    if (history) {
      console.log(`\n\n📚 VEHICLE HISTORY DATA (Cached from CheckCarDetails):`);
      console.log('=' .repeat(60));
      console.log(`Make: ${history.make}`);
      console.log(`Model: ${history.model}`);
      console.log(`Variant: ${history.variant || '❌ MISSING'}`);
      console.log(`Transmission: ${history.transmission || '❌ MISSING'}`);
      console.log(`Doors: ${history.doors || '❌ MISSING'}`);
      console.log(`Seats: ${history.seats || '❌ MISSING'}`);
      console.log(`Emission Class: ${history.emissionClass || '❌ MISSING'}`);
      console.log(`\n💰 RUNNING COSTS:`);
      console.log(`Urban MPG: ${history.urbanMpg || '❌ MISSING'}`);
      console.log(`Extra Urban MPG: ${history.extraUrbanMpg || '❌ MISSING'}`);
      console.log(`Combined MPG: ${history.combinedMpg || '❌ MISSING'}`);
      console.log(`Annual Tax: £${history.annualTax || '❌ MISSING'}`);
      console.log(`Insurance Group: ${history.insuranceGroup || '❌ MISSING'}`);
      console.log(`\n📅 Last Updated: ${history.checkDate}`);
      console.log(`API Provider: ${history.apiProvider}`);
    }

    console.log(`\n\n✅ DATA COMPLETENESS SCORE:`);
    console.log('=' .repeat(60));
    
    const requiredFields = [
      'variant', 'transmission', 'doors', 'seats', 'emissionClass',
      'urbanMpg', 'combinedMpg', 'annualTax'
    ];
    
    let completedFields = 0;
    requiredFields.forEach(field => {
      if (car[field]) completedFields++;
    });
    
    const completeness = Math.round((completedFields / requiredFields.length) * 100);
    console.log(`${completedFields}/${requiredFields.length} fields populated (${completeness}%)`);
    
    if (completeness >= 90) {
      console.log(`\n🎉 EXCELLENT! Data is ${completeness}% complete`);
    } else if (completeness >= 70) {
      console.log(`\n⚠️  GOOD but needs improvement: ${completeness}% complete`);
    } else {
      console.log(`\n❌ POOR: Only ${completeness}% complete - needs fixing`);
    }

    console.log(`\n\n🔗 View car: https://carcatlog.vercel.app/cars/${CAR_ID}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

verifyData();
