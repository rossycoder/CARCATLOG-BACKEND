/**
 * Clear vehicle history cache to force fresh API calls
 * This will delete old cached data so new checks fetch latest info
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function clearHistoryCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get count before deletion
    const count = await VehicleHistory.countDocuments();
    console.log(`Found ${count} cached vehicle history records\n`);

    if (count === 0) {
      console.log('No cached records to delete.');
      return;
    }

    // Show some sample records
    const samples = await VehicleHistory.find()
      .select('vrm make model checkDate isWrittenOff hasAccidentHistory')
      .limit(5);

    console.log('Sample cached records:');
    samples.forEach((record, i) => {
      console.log(`${i + 1}. ${record.vrm} - ${record.make} ${record.model}`);
      console.log(`   Checked: ${new Date(record.checkDate).toLocaleDateString()}`);
      console.log(`   Write-off: ${record.isWrittenOff ? 'YES' : 'NO'}`);
    });

    console.log('\n⚠️  This will delete ALL cached vehicle history records.');
    console.log('Next time a vehicle is checked, fresh data will be fetched from API.\n');

    // Delete all cached records
    const result = await VehicleHistory.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} cached records\n`);

    console.log('🎯 Next Steps:');
    console.log('1. Frontend will now fetch fresh data from API');
    console.log('2. Write-off information will be properly displayed');
    console.log('3. Test with: node backend/scripts/testFrontendHistoryEndpoint.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

clearHistoryCache();
