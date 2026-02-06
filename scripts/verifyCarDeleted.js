/**
 * Verify car is deleted from database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function verifyDeleted() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '6985230742cb4536af9616e5';
    const vrm = 'NL70NPA';
    
    console.log(`\n🔍 Checking if car is deleted...`);
    
    // Check Car
    const car = await Car.findById(carId);
    if (car) {
      console.log('❌ Car STILL EXISTS in database!');
      console.log(`   ID: ${car._id}`);
      console.log(`   Registration: ${car.registrationNumber}`);
    } else {
      console.log('✅ Car is DELETED from database');
    }

    // Check VehicleHistory
    const history = await VehicleHistory.findOne({
      vrm: vrm.toUpperCase().replace(/\s/g, '')
    });
    
    if (history) {
      console.log('\n❌ VehicleHistory STILL EXISTS!');
      console.log(`   ID: ${history._id}`);
      console.log(`   VRM: ${history.vrm}`);
    } else {
      console.log('\n✅ VehicleHistory is DELETED from database');
    }

    // Check all cars with this registration
    const allCars = await Car.find({
      registrationNumber: vrm.toUpperCase()
    });
    
    console.log(`\n📊 Total cars with registration ${vrm}: ${allCars.length}`);
    
    if (allCars.length > 0) {
      console.log('\n⚠️  Found cars:');
      allCars.forEach(c => {
        console.log(`   - ID: ${c._id}, Status: ${c.advertStatus}, Created: ${c.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

verifyDeleted();
