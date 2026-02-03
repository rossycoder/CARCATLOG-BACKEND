const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

// Load environment variables
require('dotenv').config();

// Check database status for cars and vehicle history
async function checkDatabaseStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Database Status Check');
    console.log('=' .repeat(60));

    // Count total cars
    const totalCars = await Car.countDocuments();
    console.log(`📊 Total Cars: ${totalCars}`);

    // Count total vehicle history documents
    const totalVehicleHistory = await VehicleHistory.countDocuments();
    console.log(`📊 Total VehicleHistory Documents: ${totalVehicleHistory}`);

    // Find cars with their details
    console.log('\n📋 Cars in Database:');
    const cars = await Car.find({}, {
      _id: 1,
      registrationNumber: 1,
      make: 1,
      model: 1,
      historyCheckId: 1,
      motHistory: 1,
      valuation: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    cars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.registrationNumber || 'No Reg'} - ${car.make} ${car.model}`);
      console.log(`   ID: ${car._id}`);
      console.log(`   History Check ID: ${car.historyCheckId || 'None'}`);
      console.log(`   MOT History: ${car.motHistory ? car.motHistory.length : 0} tests`);
      console.log(`   Valuation: ${car.valuation ? 'Yes' : 'No'}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log('');
    });

    // Find vehicle history documents
    console.log('\n📋 VehicleHistory Documents:');
    const vehicleHistories = await VehicleHistory.find({}, {
      _id: 1,
      vrm: 1,
      make: 1,
      model: 1,
      motHistory: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    vehicleHistories.forEach((vh, index) => {
      console.log(`${index + 1}. ${vh.vrm || 'No VRM'} - ${vh.make} ${vh.model}`);
      console.log(`   ID: ${vh._id}`);
      console.log(`   MOT History: ${vh.motHistory ? vh.motHistory.length : 0} tests`);
      console.log(`   Created: ${vh.createdAt}`);
      console.log('');
    });

    // Check for orphaned vehicle history (not linked to any car)
    console.log('\n🔍 Checking for Orphaned VehicleHistory Documents:');
    const linkedHistoryIds = cars.map(car => car.historyCheckId).filter(Boolean);
    console.log(`Cars with linked history: ${linkedHistoryIds.length}`);
    
    const orphanedHistories = await VehicleHistory.find({
      _id: { $nin: linkedHistoryIds }
    });
    
    console.log(`Orphaned VehicleHistory documents: ${orphanedHistories.length}`);
    
    if (orphanedHistories.length > 0) {
      console.log('\n📋 Orphaned VehicleHistory Documents:');
      orphanedHistories.forEach((vh, index) => {
        console.log(`${index + 1}. ${vh.vrm} - ${vh._id} (Created: ${vh.createdAt})`);
      });
    }

    // Check specific car by ID
    const specificCarId = '697e75e49e282f63c4b77c09';
    console.log(`\n🔍 Checking Specific Car: ${specificCarId}`);
    
    try {
      const specificCar = await Car.findById(specificCarId).populate('historyCheckId');
      
      if (specificCar) {
        console.log('✅ Car Found:');
        console.log(`   Registration: ${specificCar.registrationNumber}`);
        console.log(`   Make/Model: ${specificCar.make} ${specificCar.model}`);
        console.log(`   History Check ID: ${specificCar.historyCheckId?._id || 'None'}`);
        console.log(`   MOT History in Car: ${specificCar.motHistory ? specificCar.motHistory.length : 0} tests`);
        console.log(`   Valuation: ${specificCar.valuation ? JSON.stringify(specificCar.valuation) : 'None'}`);
        
        if (specificCar.historyCheckId) {
          console.log(`   MOT History in VH: ${specificCar.historyCheckId.motHistory ? specificCar.historyCheckId.motHistory.length : 0} tests`);
        }
      } else {
        console.log('❌ Car not found with this ID');
      }
    } catch (error) {
      console.log('❌ Error finding specific car:', error.message);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 Database Status Check Complete');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the check
if (require.main === module) {
  checkDatabaseStatus();
}

module.exports = checkDatabaseStatus;