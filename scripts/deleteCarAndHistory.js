/**
 * Delete specific car and its VehicleHistory
 * This will allow fresh API calls when car is added again
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function deleteCarAndHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '6985230742cb4536af9616e5';
    const vrm = 'NL70NPA';
    
    console.log(`\n🗑️  Deleting car and history for: ${vrm}`);
    
    // Find car first
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📋 Car to delete:');
    console.log(`   ID: ${car._id}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   historyCheckId: ${car.historyCheckId}`);

    // Delete VehicleHistory
    if (car.historyCheckId) {
      const historyDeleted = await VehicleHistory.findByIdAndDelete(car.historyCheckId);
      if (historyDeleted) {
        console.log(`\n✅ VehicleHistory deleted: ${car.historyCheckId}`);
      } else {
        console.log(`\n⚠️  VehicleHistory not found: ${car.historyCheckId}`);
      }
    }

    // Also delete by VRM (in case there are multiple)
    const historyByVrm = await VehicleHistory.deleteMany({
      vrm: vrm.toUpperCase().replace(/\s/g, '')
    });
    console.log(`✅ Deleted ${historyByVrm.deletedCount} VehicleHistory records by VRM`);

    // Delete Car
    const carDeleted = await Car.findByIdAndDelete(carId);
    if (carDeleted) {
      console.log(`\n✅ Car deleted: ${carId}`);
    }

    console.log('\n✅ Cleanup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Client should add the same car again (NL70NPA)');
    console.log('   2. Fresh Vehicle History API call will be made');
    console.log('   3. All data will be properly saved');
    console.log('   4. API call will show on provider dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

deleteCarAndHistory();
