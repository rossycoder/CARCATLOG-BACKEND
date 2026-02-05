const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkAllRecentCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars created in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCars = await Car.find({ 
      createdAt: { $gte: yesterday }
    }).populate('historyCheckId').sort({ createdAt: -1 });

    console.log(`📊 Found ${recentCars.length} cars created in last 24 hours:`);

    for (let i = 0; i < recentCars.length; i++) {
      const car = recentCars[i];
      console.log(`\n🚗 Car ${i + 1}: ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Year: ${car.year}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log(`   User ID: ${car.userId}`);
      console.log(`   Price: £${car.price}`);
      
      // History check details
      console.log(`   History Status: ${car.historyCheckStatus}`);
      console.log(`   History Check Date: ${car.historyCheckDate || 'N/A'}`);
      
      if (car.historyCheckId && typeof car.historyCheckId === 'object') {
        console.log(`   ✅ HISTORY DATA AVAILABLE:`);
        console.log(`      Previous Owners: ${car.historyCheckId.numberOfPreviousKeepers || car.historyCheckId.previousOwners || 'N/A'}`);
        console.log(`      Write-off Category: ${car.historyCheckId.writeOffCategory || 'none'}`);
        console.log(`      Is Written Off: ${car.historyCheckId.isWrittenOff || false}`);
        console.log(`      Keys: ${car.historyCheckId.numberOfKeys || car.historyCheckId.keys || 'N/A'}`);
        console.log(`   🌐 Frontend will show: Complete history data`);
      } else if (car.historyCheckId) {
        console.log(`   ⚠️  HISTORY ID EXISTS BUT NOT POPULATED: ${car.historyCheckId}`);
        console.log(`   🌐 Frontend might show: "not available" (populate issue)`);
      } else {
        console.log(`   ❌ NO HISTORY DATA`);
        console.log(`   🌐 Frontend will show: "Vehicle history information is not available"`);
        
        // Check if there's an orphaned history record
        if (car.registrationNumber) {
          const orphanedHistory = await VehicleHistory.findOne({ vrm: car.registrationNumber.toUpperCase() });
          if (orphanedHistory) {
            console.log(`   ⚠️  FOUND ORPHANED HISTORY - Should be linked!`);
            console.log(`      History ID: ${orphanedHistory._id}`);
            console.log(`      Previous Owners: ${orphanedHistory.numberOfPreviousKeepers || orphanedHistory.previousOwners}`);
            console.log(`      Write-off Category: ${orphanedHistory.writeOffCategory || 'none'}`);
          }
        }
      }
      
      console.log(`   🌐 Frontend URL: http://localhost:3000/cars/${car._id}`);
    }

    // Check for cars with pending history status
    console.log(`\n🔍 Checking for cars with pending history status:`);
    const pendingHistoryCars = await Car.find({ 
      historyCheckStatus: 'pending'
    }).populate('historyCheckId').sort({ createdAt: -1 }).limit(10);

    if (pendingHistoryCars.length > 0) {
      console.log(`   Found ${pendingHistoryCars.length} cars with pending history`);
      for (const car of pendingHistoryCars) {
        console.log(`   - ${car.make} ${car.model} (${car.registrationNumber}) - Created: ${car.createdAt.toISOString().split('T')[0]}`);
      }
    } else {
      console.log(`   No cars with pending history status`);
    }

    // Check for cars with failed history status
    console.log(`\n🔍 Checking for cars with failed history status:`);
    const failedHistoryCars = await Car.find({ 
      historyCheckStatus: 'failed'
    }).populate('historyCheckId').sort({ createdAt: -1 }).limit(10);

    if (failedHistoryCars.length > 0) {
      console.log(`   Found ${failedHistoryCars.length} cars with failed history`);
      for (const car of failedHistoryCars) {
        console.log(`   - ${car.make} ${car.model} (${car.registrationNumber}) - Created: ${car.createdAt.toISOString().split('T')[0]}`);
      }
    } else {
      console.log(`   No cars with failed history status`);
    }

    console.log('\n✅ All recent cars check completed!');

  } catch (error) {
    console.error('❌ Error checking all recent cars:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllRecentCars();