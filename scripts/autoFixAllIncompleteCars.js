/**
 * Auto Fix All Incomplete Cars
 * Automatically fixes all cars missing:
 * - Running costs (MPG, tax)
 * - MOT data
 * - Vehicle history
 * - Engine size, variant, etc.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const autoCompleteCarDataService = require('../services/autoCompleteCarDataService');

async function autoFixAll() {
  try {
    console.log('🚀 Starting Automatic Car Data Fix\n');
    console.log('=' .repeat(60));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fix all incomplete cars
    const result = await autoCompleteCarDataService.fixAllIncompleteCars(100);

    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(60));
    console.log(`Total cars processed: ${result.total}`);
    console.log(`Successfully fixed: ${result.fixed}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Success rate: ${Math.round((result.fixed / result.total) * 100)}%`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

autoFixAll();
