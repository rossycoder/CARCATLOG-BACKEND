const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkMOTData() {
  try {
    console.log('🔍 Checking MOT Data in Database...');
    console.log('=' .repeat(40));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check MOT data in Car documents
    console.log('\n📋 Checking MOT data in Car documents:');
    const cars = await Car.find({});
    
    cars.forEach((car, index) => {
      console.log(`\nCar ${index + 1}: ${car.registrationNumber}`);
      console.log(`  motStatus: ${car.motStatus || 'undefined'}`);
      console.log(`  motDue: ${car.motDue || 'undefined'}`);
      console.log(`  motExpiry: ${car.motExpiry || 'undefined'}`);
      console.log(`  historyCheckId: ${car.historyCheckId || 'undefined'}`);
    });

    // Check MOT data in VehicleHistory documents
    console.log('\n📋 Checking MOT data in VehicleHistory documents:');
    const histories = await VehicleHistory.find({});
    
    histories.forEach((history, index) => {
      console.log(`\nHistory ${index + 1}: ${history.vrm}`);
      console.log(`  motStatus: ${history.motStatus || 'undefined'}`);
      console.log(`  motExpiryDate: ${history.motExpiryDate || 'undefined'}`);
    });

    // Test populated query (like frontend uses)
    console.log('\n📋 Testing populated query for frontend:');
    const carWithHistory = await Car.findOne({ 
      registrationNumber: 'RJ08PFA' 
    }).populate('historyCheckId');

    if (carWithHistory) {
      console.log(`\nCar: ${carWithHistory.registrationNumber}`);
      console.log('Direct MOT fields:');
      console.log(`  motStatus: ${carWithHistory.motStatus || 'undefined'}`);
      console.log(`  motDue: ${carWithHistory.motDue || 'undefined'}`);
      console.log(`  motExpiry: ${carWithHistory.motExpiry || 'undefined'}`);
      
      if (carWithHistory.historyCheckId) {
        console.log('History MOT fields:');
        console.log(`  historyCheckId.motStatus: ${carWithHistory.historyCheckId.motStatus || 'undefined'}`);
        console.log(`  historyCheckId.motExpiryDate: ${carWithHistory.historyCheckId.motExpiryDate || 'undefined'}`);
      }

      // Simulate what frontend will receive
      console.log('\n🎯 Frontend will receive:');
      const frontendData = {
        registrationNumber: carWithHistory.registrationNumber,
        motStatus: carWithHistory.motStatus,
        motDue: carWithHistory.motDue,
        motExpiry: carWithHistory.motExpiry,
        historyCheckId: carWithHistory.historyCheckId
      };
      
      console.log('carData structure:');
      console.log(JSON.stringify(frontendData, null, 2));
    }

    // If no MOT data, let's add some sample data
    if (!carWithHistory.motStatus && !carWithHistory.motDue) {
      console.log('\n🔧 Adding sample MOT data...');
      
      await Car.findByIdAndUpdate(carWithHistory._id, {
        motStatus: 'Valid',
        motDue: new Date('2025-03-15'),
        motExpiry: new Date('2025-03-15')
      });
      
      console.log('✅ Sample MOT data added');
      
      // Test again
      const updatedCar = await Car.findById(carWithHistory._id);
      console.log('Updated MOT data:');
      console.log(`  motStatus: ${updatedCar.motStatus}`);
      console.log(`  motDue: ${updatedCar.motDue}`);
      console.log(`  motExpiry: ${updatedCar.motExpiry}`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the check
checkMOTData();