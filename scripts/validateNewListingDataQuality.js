require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

/**
 * Validates that recent vehicle listings have proper model variant data
 * This helps ensure the automatic population is working correctly
 */
async function validateNewListingDataQuality() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get cars created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCars = await Car.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    console.log('='.repeat(70));
    console.log('NEW LISTING DATA QUALITY REPORT');
    console.log('='.repeat(70));
    console.log(`Checking vehicles created in the last 30 days...\n`);

    if (recentCars.length === 0) {
      console.log('No vehicles created in the last 30 days.');
      return;
    }

    let withVariant = 0;
    let withoutVariant = 0;
    const missingVariants = [];

    console.log(`Total recent vehicles: ${recentCars.length}\n`);
    console.log('Analyzing...\n');

    for (const car of recentCars) {
      if (car.submodel && car.submodel.trim()) {
        withVariant++;
      } else {
        withoutVariant++;
        missingVariants.push({
          id: car._id,
          make: car.make,
          model: car.model,
          registration: car.registrationNumber,
          createdAt: car.createdAt
        });
      }
    }

    const percentage = ((withVariant / recentCars.length) * 100).toFixed(1);

    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ With model variant: ${withVariant} (${percentage}%)`);
    console.log(`❌ Without model variant: ${withoutVariant} (${(100 - percentage).toFixed(1)}%)`);
    console.log('='.repeat(70));

    if (missingVariants.length > 0) {
      console.log('\n⚠️  VEHICLES MISSING MODEL VARIANT:\n');
      console.log('-'.repeat(70));
      
      missingVariants.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model}`);
        console.log(`   Registration: ${car.registration || 'N/A'}`);
        console.log(`   Created: ${car.createdAt.toLocaleDateString()}`);
        console.log(`   ID: ${car.id}`);
        console.log('');
      });

      console.log('='.repeat(70));
      console.log('RECOMMENDATION');
      console.log('='.repeat(70));
      console.log('Run the population script to fix these vehicles:');
      console.log('  node backend/scripts/populateAllCarVariants.js');
      console.log('='.repeat(70));
    } else {
      console.log('\n✅ All recent vehicles have model variants!');
      console.log('   The automatic population is working correctly.');
    }

    // Check if any recent cars have registration but no variant
    const withRegNoVariant = recentCars.filter(car => 
      car.registrationNumber && 
      car.registrationNumber.trim() && 
      (!car.submodel || !car.submodel.trim())
    );

    if (withRegNoVariant.length > 0) {
      console.log('\n⚠️  WARNING: Found vehicles with registration but no variant');
      console.log(`   This suggests the API might not have data for these vehicles.`);
      console.log(`   Count: ${withRegNoVariant.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

validateNewListingDataQuality();
