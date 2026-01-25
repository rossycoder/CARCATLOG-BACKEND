/**
 * Find Clean Vehicles (No Write-Off)
 * 
 * This script finds vehicles in the database that have NO write-off history
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function findCleanVehicles() {
  try {
    console.log('🔍 Finding vehicles with clean history (no write-off)...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all cars with history data
    const cars = await Car.find({
      advertStatus: 'active',
      historyCheckId: { $exists: true, $ne: null }
    }).populate('historyCheckId').select('make model registrationNumber color historyCheckId');

    console.log(`Checking ${cars.length} cars with history data...\n`);

    const cleanVehicles = [];
    const writtenOffVehicles = [];

    for (const car of cars) {
      if (car.historyCheckId) {
        const history = car.historyCheckId;
        const isWrittenOff = history.isWrittenOff === true || 
                            history.hasAccidentHistory === true || 
                            (history.accidentDetails?.severity && history.accidentDetails.severity !== 'unknown');

        if (isWrittenOff) {
          writtenOffVehicles.push({
            registration: car.registrationNumber,
            make: car.make,
            model: car.model,
            color: car.color,
            severity: history.accidentDetails?.severity || 'Unknown'
          });
        } else {
          cleanVehicles.push({
            registration: car.registrationNumber,
            make: car.make,
            model: car.model,
            color: car.color
          });
        }
      }
    }

    console.log('✅ CLEAN VEHICLES (No Write-Off):');
    console.log('='.repeat(60));
    if (cleanVehicles.length > 0) {
      cleanVehicles.forEach(v => {
        console.log(`   ${v.registration} - ${v.make} ${v.model} (${v.color})`);
      });
    } else {
      console.log('   None found');
    }

    console.log('\n❌ WRITTEN-OFF VEHICLES:');
    console.log('='.repeat(60));
    if (writtenOffVehicles.length > 0) {
      writtenOffVehicles.forEach(v => {
        console.log(`   ${v.registration} - ${v.make} ${v.model} (${v.color}) - Category ${v.severity}`);
      });
    } else {
      console.log('   None found');
    }

    console.log('\n📊 Summary:');
    console.log(`   Clean vehicles: ${cleanVehicles.length}`);
    console.log(`   Written-off vehicles: ${writtenOffVehicles.length}`);

    console.log('\n💡 Recommendation:');
    if (cleanVehicles.length > 0) {
      console.log(`   Use one of the clean vehicles above for testing.`);
    } else {
      console.log(`   All vehicles in database have write-off history.`);
      console.log(`   Try using a different registration like: HUM777A, NU10YEV`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
findCleanVehicles();
