/**
 * Clear ALL vehicle cache to force fresh API lookups
 * This will delete all VehicleHistory records
 * Use with caution - this affects all cached vehicles!
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function clearAllCache() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${process.env.MONGODB_URI.includes('localhost') ? 'Local' : 'Production'}`);

    // Count existing cache records
    const count = await VehicleHistory.countDocuments();
    console.log(`\n📊 Found ${count} cached vehicle records`);
    
    if (count === 0) {
      console.log('⚠️  No cache found - nothing to clear');
      process.exit(0);
    }

    // Show some examples of what will be deleted
    const samples = await VehicleHistory.find().limit(5).select('vrm make model yearOfManufacture checkDate');
    console.log('\n📋 Sample cached vehicles:');
    samples.forEach((vehicle, index) => {
      const age = vehicle.checkDate ? Math.round((Date.now() - new Date(vehicle.checkDate).getTime()) / (24 * 60 * 60 * 1000)) : 'N/A';
      console.log(`   ${index + 1}. ${vehicle.vrm} - ${vehicle.make || 'N/A'} ${vehicle.model || 'N/A'} (${vehicle.yearOfManufacture || 'N/A'}) - ${age} days old`);
    });
    
    if (count > 5) {
      console.log(`   ... and ${count - 5} more`);
    }

    console.log('\n⚠️  WARNING: This will delete ALL cached vehicle data!');
    console.log('   Next lookups will fetch fresh data from APIs');
    console.log('   This may increase API costs temporarily');
    
    // Delete all cache records
    console.log('\n🗑️  Deleting all cache...');
    const result = await VehicleHistory.deleteMany({});
    
    if (result.deletedCount > 0) {
      console.log(`\n✅ Successfully deleted ${result.deletedCount} cached vehicle records`);
    } else {
      console.log('\n❌ Failed to delete cache');
    }
    
    // Verify deletion
    const remaining = await VehicleHistory.countDocuments();
    if (remaining === 0) {
      console.log('\n✅ Verified: All vehicle cache is cleared');
      console.log('   Next lookups will fetch fresh data from APIs');
      console.log('   Fresh data will be cached for 30 days');
    } else {
      console.log(`\n⚠️  Warning: ${remaining} records still remain`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   Cannot connect to database. Check MONGODB_URI in .env file');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

clearAllCache();
