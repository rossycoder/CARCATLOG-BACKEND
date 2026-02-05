const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const User = require('../models/User');

async function checkAllUserCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const testUser = await User.findOne({ email: 'rozeena031@gmail.com' });
    console.log(`✅ Found user: ${testUser.email} (ID: ${testUser._id})`);

    // Find ALL cars for this user
    const allUserCars = await Car.find({ userId: testUser._id }).populate('historyCheckId');
    console.log(`\n📊 Found ${allUserCars.length} cars for user:`);

    for (let i = 0; i < allUserCars.length; i++) {
      const car = allUserCars[i];
      console.log(`\n🚗 Car ${i + 1}: ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Year: ${car.year}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log(`   Price: £${car.price}`);
      
      // History check details
      console.log(`   History Status: ${car.historyCheckStatus}`);
      console.log(`   History Check Date: ${car.historyCheckDate || 'N/A'}`);
      console.log(`   History Check ID: ${car.historyCheckId ? (car.historyCheckId._id || car.historyCheckId) : 'N/A'}`);
      
      if (car.historyCheckId && typeof car.historyCheckId === 'object') {
        console.log(`   ✅ HISTORY DATA AVAILABLE:`);
        console.log(`      Previous Owners: ${car.historyCheckId.numberOfPreviousKeepers || car.historyCheckId.previousOwners || 'N/A'}`);
        console.log(`      Write-off Category: ${car.historyCheckId.writeOffCategory || 'none'}`);
        console.log(`      Is Written Off: ${car.historyCheckId.isWrittenOff || false}`);
        console.log(`      Keys: ${car.historyCheckId.numberOfKeys || car.historyCheckId.keys || 'N/A'}`);
        
        // Test frontend URL
        console.log(`   🌐 Frontend URL: http://localhost:3000/cars/${car._id}`);
        console.log(`   🌐 Alternative URL: http://localhost:3000/cars/${car.advertId}`);
      } else {
        console.log(`   ❌ NO HISTORY DATA - Frontend will show "not available"`);
        console.log(`   🌐 Frontend URL: http://localhost:3000/cars/${car._id}`);
        
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
    }

    // Check for any recent cars that might be missing history
    console.log(`\n🔍 Checking for cars created in last 24 hours:`);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCars = await Car.find({ 
      createdAt: { $gte: yesterday },
      userId: testUser._id 
    }).populate('historyCheckId');

    if (recentCars.length > 0) {
      console.log(`   Found ${recentCars.length} recent cars`);
      for (const car of recentCars) {
        console.log(`   - ${car.make} ${car.model} (${car.registrationNumber}) - History: ${car.historyCheckStatus}`);
      }
    } else {
      console.log(`   No cars created in last 24 hours`);
    }

    console.log('\n✅ All user cars check completed!');
    console.log('\n📋 SUMMARY:');
    console.log(`   Total cars: ${allUserCars.length}`);
    console.log(`   Cars with history: ${allUserCars.filter(c => c.historyCheckId && typeof c.historyCheckId === 'object').length}`);
    console.log(`   Cars without history: ${allUserCars.filter(c => !c.historyCheckId || typeof c.historyCheckId !== 'object').length}`);

  } catch (error) {
    console.error('❌ Error checking all user cars:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllUserCars();