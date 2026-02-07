const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixAllCarsMOTDueDate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    console.log('=== FIXING ALL CARS MOT DUE DATE ===\n');

    // Find ALL cars (including those with MOT history)
    const allCars = await Car.find({});
    console.log(`Found ${allCars.length} total cars in database\n`);

    let fixed = 0;
    let alreadySet = 0;
    let noMOTData = 0;
    let newCars = 0;

    for (const car of allCars) {
      try {
        const reg = car.registrationNumber || car.registration || 'Unknown';
        const year = car.year || car.yearOfManufacture;
        
        // Check if car is too new for MOT (less than 3 years old)
        const currentYear = new Date().getFullYear();
        if (year && year >= currentYear - 2) {
          console.log(`⏭️  ${reg} - New car (${year}), MOT not required yet`);
          newCars++;
          continue;
        }

        // Check if motDue/motExpiry already set
        if (car.motDue || car.motExpiry) {
          console.log(`✓ ${reg} - MOT due already set: ${new Date(car.motDue || car.motExpiry).toLocaleDateString('en-GB')}`);
          alreadySet++;
          continue;
        }

        // Try to get MOT data from motHistory array
        if (car.motHistory && car.motHistory.length > 0) {
          const latestTest = car.motHistory[0];
          
          if (latestTest && latestTest.expiryDate) {
            car.motDue = latestTest.expiryDate;
            car.motExpiry = latestTest.expiryDate;
            car.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
            
            await car.save();
            
            console.log(`✅ ${reg} - Fixed from motHistory`);
            console.log(`   MOT Due: ${new Date(car.motDue).toLocaleDateString('en-GB')}`);
            console.log(`   Status: ${car.motStatus}\n`);
            
            fixed++;
            continue;
          }
        }

        // Try to get MOT data from VehicleHistory
        const history = await VehicleHistory.findOne({ 
          vrm: reg.toUpperCase() 
        });

        if (history) {
          // Try motExpiryDate field
          if (history.motExpiryDate) {
            car.motDue = history.motExpiryDate;
            car.motExpiry = history.motExpiryDate;
            car.motStatus = history.motStatus || 'Unknown';
            
            await car.save();
            
            console.log(`✅ ${reg} - Fixed from VehicleHistory.motExpiryDate`);
            console.log(`   MOT Due: ${new Date(car.motDue).toLocaleDateString('en-GB')}\n`);
            
            fixed++;
            continue;
          }

          // Try motTests array
          if (history.motTests && history.motTests.length > 0) {
            const latestTest = history.motTests[0];
            
            if (latestTest && latestTest.expiryDate) {
              car.motDue = latestTest.expiryDate;
              car.motExpiry = latestTest.expiryDate;
              car.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
              
              // Also update VehicleHistory
              history.motExpiryDate = latestTest.expiryDate;
              history.motStatus = car.motStatus;
              await history.save();
              
              await car.save();
              
              console.log(`✅ ${reg} - Fixed from VehicleHistory.motTests`);
              console.log(`   MOT Due: ${new Date(car.motDue).toLocaleDateString('en-GB')}\n`);
              
              fixed++;
              continue;
            }
          }
        }

        // No MOT data found anywhere
        console.log(`⚠️  ${reg} - No MOT data found (Year: ${year || 'Unknown'})`);
        noMOTData++;

      } catch (error) {
        console.error(`❌ Error fixing ${car.registrationNumber || car._id}:`, error.message);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total cars: ${allCars.length}`);
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`✓ Already set: ${alreadySet}`);
    console.log(`⏭️  New cars (no MOT required): ${newCars}`);
    console.log(`⚠️  No MOT data: ${noMOTData}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixAllCarsMOTDueDate();
