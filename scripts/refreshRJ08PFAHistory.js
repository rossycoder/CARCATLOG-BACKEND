require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

async function refreshRJ08PFAHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'RJ08PFA';
    
    // Delete existing history
    console.log(`🗑️  Deleting old history for ${vrm}...`);
    const deleted = await VehicleHistory.deleteMany({ vrm });
    console.log(`Deleted ${deleted.deletedCount} old history records\n`);
    
    // Fetch fresh data from API
    console.log(`📡 Fetching fresh data from CheckCarDetails API...`);
    const historyService = new HistoryService();
    const freshHistory = await historyService.checkVehicleHistory(vrm, true);
    
    console.log('\n=== Fresh History Data ===');
    console.log('Number of Previous Keepers:', freshHistory.numberOfPreviousKeepers);
    console.log('Previous Owners:', freshHistory.previousOwners);
    console.log('Number of Owners:', freshHistory.numberOfOwners);
    console.log('V5C Certificate Count:', freshHistory.v5cCertificateCount);
    console.log('Keeper Changes Count:', freshHistory.keeperChangesList?.length);
    console.log('Is Stolen:', freshHistory.isStolen);
    console.log('Is Written Off:', freshHistory.isWrittenOff);
    console.log('Has Accident History:', freshHistory.hasAccidentHistory);
    console.log('API Provider:', freshHistory.apiProvider);
    
    // Update car with new history reference
    console.log(`\n🚗 Updating car with new history reference...`);
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (car) {
      car.historyCheckStatus = 'verified';
      car.historyCheckDate = new Date();
      car.historyCheckId = freshHistory._id;
      await car.save();
      console.log('✅ Car updated successfully');
      console.log('Car ID:', car._id);
      console.log('History Check ID:', car.historyCheckId);
    } else {
      console.log('⚠️  Car not found');
    }
    
    console.log('\n✅ History refresh complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Clear browser cache (Ctrl+Shift+R)');
    console.log('2. Refresh the car detail page');
    console.log('3. Check if owners now show correctly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

refreshRJ08PFAHistory();
