/**
 * Sync running costs from VehicleHistory to Car documents
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function syncRunningCosts() {
  console.log('Syncing running costs from VehicleHistory to Cars...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autotrader');
    console.log('✅ Connected to database\n');

    // Find all cars
    const cars = await Car.find({});
    console.log(`Found ${cars.length} cars to check\n`);

    let updated = 0;
    let skipped = 0;

    for (const car of cars) {
      const vrm = car.registrationNumber;
      
      // Find corresponding VehicleHistory
      const history = await VehicleHistory.findOne({ vrm: vrm }).sort({ checkDate: -1 });
      
      if (!history) {
        console.log(`⚠️  ${vrm}: No history found - skipping`);
        skipped++;
        continue;
      }

      // Check if running costs exist in history
      if (history.combinedMpg || history.co2Emissions) {
        // Update car with running costs
        car.runningCosts = {
          fuelEconomy: {
            urban: history.urbanMpg,
            extraUrban: history.extraUrbanMpg,
            combined: history.combinedMpg
          },
          co2Emissions: history.co2Emissions,
          insuranceGroup: history.insuranceGroup,
          annualTax: history.annualTax,
          emissionClass: history.emissionClass
        };

        // Also update legacy fields
        car.urbanMpg = history.urbanMpg;
        car.extraUrbanMpg = history.extraUrbanMpg;
        car.combinedMpg = history.combinedMpg;
        car.co2Emissions = history.co2Emissions;
        car.insuranceGroup = history.insuranceGroup;
        car.annualTax = history.annualTax;

        await car.save();
        console.log(`✅ ${vrm}: Updated with MPG=${history.combinedMpg}, CO2=${history.co2Emissions}`);
        updated++;
      } else {
        console.log(`⚠️  ${vrm}: No running costs in history - skipping`);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Updated: ${updated} cars`);
    console.log(`⚠️  Skipped: ${skipped} cars`);
    console.log('\n🎉 Done! Refresh your frontend to see running costs.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

syncRunningCosts();
