const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const User = require('../models/User');

async function checkVehicleHistoryIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const testUser = await User.findOne({ email: 'rozeena031@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    console.log(`✅ Found user: ${testUser.email} (ID: ${testUser._id})`);

    // Find user's cars
    const userCars = await Car.find({ userId: testUser._id }).populate('historyCheckId');
    console.log(`\n📊 Found ${userCars.length} cars for user:`);

    for (const car of userCars) {
      console.log(`\n🚗 Car: ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   History Check Status: ${car.historyCheckStatus}`);
      console.log(`   History Check Date: ${car.historyCheckDate || 'N/A'}`);
      console.log(`   History Check ID: ${car.historyCheckId ? car.historyCheckId._id || car.historyCheckId : 'N/A'}`);
      
      if (car.historyCheckId) {
        if (typeof car.historyCheckId === 'object' && car.historyCheckId._id) {
          // Populated history data
          console.log(`   ✅ History Data Populated:`);
          console.log(`      VRM: ${car.historyCheckId.vrm}`);
          console.log(`      Make/Model: ${car.historyCheckId.make} ${car.historyCheckId.model}`);
          console.log(`      Previous Owners: ${car.historyCheckId.numberOfPreviousKeepers || car.historyCheckId.previousOwners || 'N/A'}`);
          console.log(`      Write-off Category: ${car.historyCheckId.writeOffCategory || 'none'}`);
          console.log(`      Is Written Off: ${car.historyCheckId.isWrittenOff || false}`);
          console.log(`      Check Status: ${car.historyCheckId.checkStatus}`);
          console.log(`      API Provider: ${car.historyCheckId.apiProvider}`);
        } else {
          // Just the ID reference
          console.log(`   ⚠️  History ID exists but not populated: ${car.historyCheckId}`);
          
          // Try to find the history record manually
          const historyRecord = await VehicleHistory.findById(car.historyCheckId);
          if (historyRecord) {
            console.log(`   ✅ Found history record manually:`);
            console.log(`      VRM: ${historyRecord.vrm}`);
            console.log(`      Previous Owners: ${historyRecord.numberOfPreviousKeepers || historyRecord.previousOwners || 'N/A'}`);
            console.log(`      Write-off Category: ${historyRecord.writeOffCategory || 'none'}`);
          } else {
            console.log(`   ❌ History record not found in database`);
          }
        }
      } else {
        console.log(`   ❌ No history check ID`);
        
        // Check if there's a history record for this registration
        if (car.registrationNumber) {
          const historyRecord = await VehicleHistory.findOne({ vrm: car.registrationNumber.toUpperCase() });
          if (historyRecord) {
            console.log(`   ⚠️  Found orphaned history record for ${car.registrationNumber}:`);
            console.log(`      History ID: ${historyRecord._id}`);
            console.log(`      Previous Owners: ${historyRecord.numberOfPreviousKeepers || historyRecord.previousOwners || 'N/A'}`);
            console.log(`      Write-off Category: ${historyRecord.writeOffCategory || 'none'}`);
            console.log(`      Should link this to car!`);
          }
        }
      }
    }

    // Check all vehicle history records
    console.log(`\n📊 All Vehicle History Records:`);
    const allHistory = await VehicleHistory.find({}).sort({ checkDate: -1 });
    console.log(`   Found ${allHistory.length} history records total`);

    for (const history of allHistory) {
      console.log(`\n📋 History Record: ${history._id}`);
      console.log(`   VRM: ${history.vrm}`);
      console.log(`   Make/Model: ${history.make} ${history.model}`);
      console.log(`   Previous Owners: ${history.numberOfPreviousKeepers || history.previousOwners || 'N/A'}`);
      console.log(`   Write-off Category: ${history.writeOffCategory || 'none'}`);
      console.log(`   Is Written Off: ${history.isWrittenOff || false}`);
      console.log(`   Check Date: ${history.checkDate}`);
      console.log(`   API Provider: ${history.apiProvider}`);
      
      // Check if any car is linked to this history
      const linkedCar = await Car.findOne({ historyCheckId: history._id });
      if (linkedCar) {
        console.log(`   ✅ Linked to car: ${linkedCar.make} ${linkedCar.model} (${linkedCar._id})`);
      } else {
        console.log(`   ❌ No car linked to this history record`);
      }
    }

    console.log('\n✅ Vehicle history issue check completed!');

  } catch (error) {
    console.error('❌ Error checking vehicle history issue:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkVehicleHistoryIssue();