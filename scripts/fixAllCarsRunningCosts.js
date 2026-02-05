/**
 * Fix running costs for all existing cars
 * Fetches running costs from VehicleHistory and saves to Car records
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixAllCarsRunningCosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars without running costs
    const carsWithoutRunningCosts = await Car.find({
      $or: [
        { 'runningCosts.fuelEconomy.combined': { $exists: false } },
        { 'runningCosts.fuelEconomy.combined': null },
        { runningCosts: null }
      ]
    }).select('registrationNumber make model year runningCosts');

    console.log(`\n📊 Found ${carsWithoutRunningCosts.length} cars without running costs`);

    if (carsWithoutRunningCosts.length === 0) {
      console.log('✅ All cars already have running costs!');
      process.exit(0);
    }

    let fixed = 0;
    let notFound = 0;
    let noData = 0;

    console.log('\n🔧 Fixing running costs...\n');

    for (const car of carsWithoutRunningCosts) {
      const vrm = car.registrationNumber.toUpperCase().replace(/\s/g, '');
      
      // Find vehicle history for this car
      const history = await VehicleHistory.findOne({ vrm: vrm });

      if (!history) {
        console.log(`⚠️  ${vrm} - No vehicle history found`);
        notFound++;
        continue;
      }

      // Check if history has running costs data
      const hasRunningCosts = history.urbanMpg || history.extraUrbanMpg || 
                             history.combinedMpg || history.co2Emissions || 
                             history.insuranceGroup || history.annualTax;

      if (!hasRunningCosts) {
        console.log(`⚠️  ${vrm} - No running costs in history`);
        noData++;
        continue;
      }

      // Update car with running costs from history
      car.runningCosts = {
        fuelEconomy: {
          urban: history.urbanMpg || null,
          extraUrban: history.extraUrbanMpg || null,
          combined: history.combinedMpg || null
        },
        co2Emissions: history.co2Emissions || null,
        insuranceGroup: history.insuranceGroup || null,
        annualTax: history.annualTax || null
      };

      // Also save to individual fields for backward compatibility
      car.co2Emissions = history.co2Emissions || car.co2Emissions;
      car.insuranceGroup = history.insuranceGroup || car.insuranceGroup;
      car.annualTax = history.annualTax || car.annualTax;

      await car.save();
      
      console.log(`✅ ${vrm} - Running costs updated`);
      console.log(`   Combined MPG: ${history.combinedMpg || 'N/A'}`);
      console.log(`   CO2: ${history.co2Emissions || 'N/A'}g/km`);
      console.log(`   Insurance: Group ${history.insuranceGroup || 'N/A'}`);
      console.log(`   Tax: £${history.annualTax || 'N/A'}/year\n`);
      
      fixed++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed} cars`);
    console.log(`   ⚠️  No history: ${notFound} cars`);
    console.log(`   ⚠️  No data: ${noData} cars`);
    console.log(`   📊 Total: ${carsWithoutRunningCosts.length} cars processed`);

    if (fixed > 0) {
      console.log('\n✅ Running costs have been updated for existing cars');
    }

    if (notFound > 0 || noData > 0) {
      console.log('\n💡 For cars without data:');
      console.log('   - They may be very old or uncommon vehicles');
      console.log('   - API may not have running costs data');
      console.log('   - You can manually add running costs if needed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixAllCarsRunningCosts();
