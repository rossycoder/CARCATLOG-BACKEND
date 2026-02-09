/**
 * Automatic Fix: Clear all cache and update all cars with running costs
 * This script will:
 * 1. Clear all VehicleHistory cache
 * 2. Update all existing cars with fresh running costs data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('./models/VehicleHistory');
const Car = require('./models/Car');
const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');

async function fixAllRunningCosts() {
  console.log('='.repeat(70));
  console.log('AUTOMATIC FIX: Running Costs for All Cars');
  console.log('='.repeat(70));
  console.log();

  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autotrader');
    console.log('✅ Connected');
    console.log();

    // Step 1: Clear ALL cache
    console.log('Step 1: Clearing ALL VehicleHistory cache...');
    const deleteResult = await VehicleHistory.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} cache records`);
    console.log();

    // Step 2: Find all cars without running costs
    console.log('Step 2: Finding cars without running costs...');
    const carsWithoutRunningCosts = await Car.find({
      $or: [
        { 'runningCosts.fuelEconomy.combined': { $in: [null, undefined, ''] } },
        { 'runningCosts.co2Emissions': { $in: [null, undefined, ''] } },
        { runningCosts: { $exists: false } }
      ]
    }).limit(50); // Process 50 cars at a time to avoid API limits

    console.log(`Found ${carsWithoutRunningCosts.length} cars to update`);
    console.log();

    if (carsWithoutRunningCosts.length === 0) {
      console.log('✅ All cars already have running costs data!');
      return;
    }

    // Step 3: Update each car with running costs
    console.log('Step 3: Fetching running costs for each car...');
    console.log('(This will take a few seconds per car)');
    console.log();

    const client = new CheckCarDetailsClient();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < carsWithoutRunningCosts.length; i++) {
      const car = carsWithoutRunningCosts[i];
      const vrm = car.registrationNumber;
      
      console.log(`[${i + 1}/${carsWithoutRunningCosts.length}] Processing ${vrm}...`);

      try {
        // Fetch vehicle specs (includes running costs)
        const specsData = await client.getVehicleSpecs(vrm);
        
        if (specsData && specsData.SmmtDetails) {
          const smmt = specsData.SmmtDetails;
          
          // Update running costs
          car.runningCosts = {
            fuelEconomy: {
              urban: smmt.UrbanColdMpg || null,
              extraUrban: smmt.ExtraUrbanMpg || null,
              combined: smmt.CombinedMpg || null
            },
            co2Emissions: smmt.Co2 || null,
            insuranceGroup: smmt.InsuranceGroup || null,
            annualTax: null, // Not available in API
            emissionClass: null
          };

          // Also update legacy fields
          car.urbanMpg = smmt.UrbanColdMpg || null;
          car.extraUrbanMpg = smmt.ExtraUrbanMpg || null;
          car.combinedMpg = smmt.CombinedMpg || null;
          car.co2Emissions = smmt.Co2 || null;
          car.insuranceGroup = smmt.InsuranceGroup || null;

          await car.save();
          
          console.log(`   ✅ Updated: MPG=${smmt.CombinedMpg}, CO2=${smmt.Co2}`);
          successCount++;
        } else {
          console.log(`   ⚠️  No SmmtDetails found - skipping`);
          failCount++;
        }

        // Small delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        failCount++;
      }
    }

    console.log();
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successfully updated: ${successCount} cars`);
    console.log(`❌ Failed: ${failCount} cars`);
    console.log();
    console.log('🎉 All done! Running costs are now available for all cars.');
    console.log();
    console.log('Next steps:');
    console.log('1. Restart backend server (if running)');
    console.log('2. Refresh frontend page');
    console.log('3. Running costs should now display correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log();
    console.log('Database connection closed');
  }
}

// Run the fix
fixAllRunningCosts();
