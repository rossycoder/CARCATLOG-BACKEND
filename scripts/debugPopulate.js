const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function debugPopulate() {
  try {
    console.log('🔍 Debugging Populate Issue...');
    console.log('=' .repeat(40));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a car with historyCheckId
    const car = await Car.findOne({ 
      historyCheckId: { $exists: true, $ne: null } 
    });

    if (!car) {
      console.log('❌ No cars with historyCheckId found');
      return;
    }

    console.log(`\n📋 Car found: ${car.registrationNumber}`);
    console.log(`   historyCheckId: ${car.historyCheckId}`);
    console.log(`   historyCheckId type: ${typeof car.historyCheckId}`);

    // Check if the referenced VehicleHistory exists
    const historyExists = await VehicleHistory.findById(car.historyCheckId);
    console.log(`   Referenced history exists: ${historyExists ? 'Yes' : 'No'}`);

    if (historyExists) {
      console.log(`   History VRM: ${historyExists.vrm}`);
      console.log(`   History ID: ${historyExists._id}`);
    }

    // Try populate manually
    console.log(`\n🔄 Trying populate...`);
    const populatedCar = await Car.findById(car._id).populate('historyCheckId');
    
    console.log(`   Populated result: ${populatedCar.historyCheckId ? 'Success' : 'Failed'}`);
    
    if (populatedCar.historyCheckId) {
      console.log(`   ✅ Populate worked!`);
      console.log(`   History VRM: ${populatedCar.historyCheckId.vrm}`);
      console.log(`   Previous keepers: ${populatedCar.historyCheckId.numberOfPreviousKeepers}`);
    } else {
      console.log(`   ❌ Populate failed - historyCheckId is: ${populatedCar.historyCheckId}`);
      
      // Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(car.historyCheckId)) {
        console.log(`   ObjectId is valid`);
        
        // Try direct lookup
        const directHistory = await VehicleHistory.findById(car.historyCheckId);
        console.log(`   Direct lookup result: ${directHistory ? 'Found' : 'Not found'}`);
      } else {
        console.log(`   ❌ Invalid ObjectId: ${car.historyCheckId}`);
      }
    }

    // Check VehicleHistory model name
    console.log(`\n📋 Model checks:`);
    console.log(`   VehicleHistory model name: ${VehicleHistory.modelName}`);
    console.log(`   Car historyCheckId ref: ${Car.schema.paths.historyCheckId.options.ref}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the debug
debugPopulate();