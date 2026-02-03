require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkMOTHistorySave() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car
    const registration = 'EK11XHZ';
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log(`🚗 Car: ${car.advertId}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Payment Status: ${car.advertisingPackage?.packageId ? 'PAID ✅' : 'NOT PAID ❌'}`);
    
    console.log('\n🔍 MOT History in Car Document:');
    if (car.motHistory && car.motHistory.length > 0) {
      console.log(`   ✅ Found ${car.motHistory.length} MOT records in car document`);
      console.log(`   Latest MOT: ${car.motHistory[0]?.testDate || 'No date'}`);
      console.log(`   MOT Status: ${car.motStatus || 'Not set'}`);
      console.log(`   MOT Expiry: ${car.motExpiry || 'Not set'}`);
    } else {
      console.log('   ❌ NO MOT history found in car document');
    }

    console.log('\n🔍 Vehicle History Document:');
    const vehicleHistory = await VehicleHistory.findOne({ vrm: registration });
    
    if (vehicleHistory) {
      console.log(`   ✅ Found vehicle history document: ${vehicleHistory._id}`);
      console.log(`   Created: ${vehicleHistory.createdAt}`);
      console.log(`   Updated: ${vehicleHistory.updatedAt}`);
      
      if (vehicleHistory.motHistory && vehicleHistory.motHistory.length > 0) {
        console.log(`   ✅ MOT History: ${vehicleHistory.motHistory.length} records`);
        console.log(`   Latest MOT: ${vehicleHistory.motHistory[0]?.testDate || 'No date'}`);
      } else {
        console.log('   ❌ NO MOT history in vehicle history document');
      }
    } else {
      console.log('   ❌ NO vehicle history document found');
    }

    console.log('\n🔍 History Check ID Reference:');
    if (car.historyCheckId) {
      console.log(`   ✅ Car has historyCheckId: ${car.historyCheckId}`);
      
      // Check if this ID matches the vehicle history document
      if (vehicleHistory && car.historyCheckId.toString() === vehicleHistory._id.toString()) {
        console.log('   ✅ History check ID matches vehicle history document');
      } else {
        console.log('   ⚠️ History check ID does NOT match vehicle history document');
      }
    } else {
      console.log('   ❌ Car has NO historyCheckId reference');
    }

    console.log('\n💡 ANALYSIS:');
    const issues = [];
    
    if (!car.motHistory || car.motHistory.length === 0) {
      issues.push('Car document missing MOT history');
    }
    
    if (!vehicleHistory) {
      issues.push('No vehicle history document exists');
    } else if (!vehicleHistory.motHistory || vehicleHistory.motHistory.length === 0) {
      issues.push('Vehicle history document missing MOT data');
    }
    
    if (!car.historyCheckId) {
      issues.push('Car not linked to vehicle history document');
    }

    if (issues.length > 0) {
      console.log('   ❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`     - ${issue}`));
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('   1. Ensure MOT API is called during payment completion');
      console.log('   2. Save MOT data to both car document and vehicle history');
      console.log('   3. Link car to vehicle history document via historyCheckId');
      console.log('   4. Update payment webhook to trigger MOT data save');
    } else {
      console.log('   ✅ MOT history properly saved and linked');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkMOTHistorySave();