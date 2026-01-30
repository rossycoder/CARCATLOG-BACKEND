/**
 * Check latest 2 cars and their vehicle history
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkLatest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get latest 2 cars
    const cars = await Car.find().sort({ createdAt: -1 }).limit(2);

    if (cars.length === 0) {
      console.log('❌ No cars found!');
      return;
    }

    console.log(`✅ Found ${cars.length} latest car(s)\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      
      console.log(`\n[${ i + 1}/${cars.length}] CAR DETAILS:`);
      console.log('═══════════════════════════════════════');
      console.log(`   Registration: ${car.registrationNumber}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Year: ${car.year}`);
      console.log(`   Price: £${car.price?.toLocaleString()}`);
      console.log(`   Created: ${car.createdAt.toLocaleString()}`);
      console.log(`   Status: ${car.advertStatus}`);
      
      // Check vehicle history
      if (car.registrationNumber) {
        console.log('\n📊 VEHICLE HISTORY:');
        
        const history = await VehicleHistory.findOne({ 
          vrm: car.registrationNumber 
        }).sort({ checkDate: -1 });
        
        if (history) {
          console.log(`   ✅ History Found!`);
          console.log(`   👥 Owners:`);
          console.log(`      - numberOfPreviousKeepers: ${history.numberOfPreviousKeepers}`);
          console.log(`      - previousOwners: ${history.previousOwners}`);
          console.log(`      - numberOfOwners: ${history.numberOfOwners}`);
          console.log(`   🔑 Keys: ${history.numberOfKeys || history.keys}`);
          console.log(`   📋 Service History: ${history.serviceHistory}`);
          console.log(`   🚗 Status:`);
          console.log(`      - Stolen: ${history.isStolen ? '❌ YES' : '✅ NO'}`);
          console.log(`      - Scrapped: ${history.isScrapped ? '❌ YES' : '✅ NO'}`);
          console.log(`      - Written Off: ${history.isWrittenOff ? '❌ YES' : '✅ NO'}`);
          
          if (history.isWrittenOff || history.writeOffCategory) {
            console.log(`      - Write-off Category: ${history.writeOffCategory || 'Unknown'}`);
          }
          
          console.log(`   📅 Check Date: ${history.checkDate.toLocaleString()}`);
          console.log(`   🔧 API Provider: ${history.apiProvider}`);
          
          // Validation
          const allOwnersZero = history.numberOfPreviousKeepers === 0 && 
                               history.previousOwners === 0 && 
                               history.numberOfOwners === 0;
          
          const allOwnersSame = history.numberOfPreviousKeepers === history.previousOwners && 
                               history.previousOwners === history.numberOfOwners;
          
          if (allOwnersZero) {
            console.log('\n   ⚠️ WARNING: All owner fields are 0!');
            console.log('   This might indicate missing data from API');
          } else if (!allOwnersSame) {
            console.log('\n   ⚠️ WARNING: Owner fields have different values!');
            console.log('   This indicates inconsistent data mapping');
          } else {
            console.log('\n   ✅ Owner data is consistent and correct!');
          }
          
        } else {
          console.log(`   ❌ No history found in database`);
          console.log(`   History will be fetched when car is viewed`);
        }
      } else {
        console.log('\n   ⚠️ No registration number - cannot check history');
      }
      
      console.log('\n═══════════════════════════════════════');
    }
    
    console.log('\n\n✅ Check Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkLatest();
