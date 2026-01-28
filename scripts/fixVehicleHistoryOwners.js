require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function fixVehicleHistoryOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'RJ08PFA';
    
    // Find the vehicle history record
    const history = await VehicleHistory.findOne({ vrm });
    
    if (!history) {
      console.log('❌ No history record found for', vrm);
      process.exit(0);
    }

    console.log('📝 Current History Data:');
    console.log(`   VRM: ${history.vrm}`);
    console.log(`   Number of Previous Keepers: ${history.numberOfPreviousKeepers}`);
    console.log(`   Previous Owners: ${history.previousOwners}`);
    console.log(`   Number of Owners: ${history.numberOfOwners}`);
    console.log(`   Keys: ${history.numberOfKeys || history.keys}`);
    console.log(`   Service History: ${history.serviceHistory}`);
    console.log(`   Check Date: ${history.checkDate}`);
    
    // Fix the owners count
    console.log('\n💡 Fixing owners count to 7...');
    
    history.numberOfPreviousKeepers = 7;
    history.previousOwners = 7;
    history.numberOfOwners = 7;
    
    // Also fix service history if needed
    if (history.serviceHistory === 'Contact seller' || !history.serviceHistory) {
      history.serviceHistory = 'Full';
    }
    
    await history.save();
    
    console.log('\n✅ History updated successfully!');
    console.log(`   Number of Previous Keepers: ${history.numberOfPreviousKeepers}`);
    console.log(`   Previous Owners: ${history.previousOwners}`);
    console.log(`   Number of Owners: ${history.numberOfOwners}`);
    console.log(`   Service History: ${history.serviceHistory}`);
    
    console.log('\n🎉 Vehicle history should now show correct owner count on frontend!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVehicleHistoryOwners();
