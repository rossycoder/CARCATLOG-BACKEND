/**
 * Check specific car by ID from URL
 * https://carcatlog.vercel.app/cars/6985230742cb4536af9616e5
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '6985230742cb4536af9616e5';
    
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📋 Car Details:');
    console.log(`   ID: ${car._id}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Created: ${car.createdAt}`);
    console.log(`   Status: ${car.advertStatus}`);

    console.log('\n🔍 Vehicle History Link:');
    console.log(`   historyCheckId: ${car.historyCheckId || 'NOT SET'}`);
    console.log(`   historyCheckStatus: ${car.historyCheckStatus || 'NOT SET'}`);
    console.log(`   historyCheckDate: ${car.historyCheckDate || 'NOT SET'}`);

    console.log('\n🔍 MOT Data:');
    console.log(`   motDue: ${car.motDue || 'NOT SET'}`);
    console.log(`   motExpiry: ${car.motExpiry || 'NOT SET'}`);
    console.log(`   motStatus: ${car.motStatus || 'NOT SET'}`);
    console.log(`   motHistory length: ${car.motHistory?.length || 0}`);

    console.log('\n💰 Running Costs:');
    console.log(`   fuelEconomyCombined: ${car.fuelEconomyCombined || 'NOT SET'}`);
    console.log(`   co2Emissions: ${car.co2Emissions || 'NOT SET'}`);
    console.log(`   insuranceGroup: ${car.insuranceGroup || 'NOT SET'}`);
    console.log(`   annualTax: ${car.annualTax || 'NOT SET'}`);

    // Check if VehicleHistory exists for this registration
    if (car.registrationNumber) {
      console.log('\n🔍 Checking VehicleHistory collection...');
      const vehicleHistory = await VehicleHistory.findOne({
        vrm: car.registrationNumber.toUpperCase().replace(/\s/g, '')
      });

      if (vehicleHistory) {
        console.log('✅ VehicleHistory found:');
        console.log(`   ID: ${vehicleHistory._id}`);
        console.log(`   VRM: ${vehicleHistory.vrm}`);
        console.log(`   Check Date: ${vehicleHistory.checkDate}`);
        console.log(`   Check Status: ${vehicleHistory.checkStatus}`);
        console.log(`   Make/Model: ${vehicleHistory.make} ${vehicleHistory.model}`);
        console.log(`   Has Running Costs: ${!!(vehicleHistory.combinedMpg || vehicleHistory.co2Emissions)}`);
        console.log(`   Has MOT History: ${!!(vehicleHistory.motHistory && vehicleHistory.motHistory.length > 0)}`);
      } else {
        console.log('❌ NO VehicleHistory found for this registration!');
        console.log('   This means Vehicle History API was NEVER called');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkCar();
