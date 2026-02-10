/**
 * Fix Hybrid vehicles incorrectly classified as Electric
 * This fixes cars where fuelType is "Electric" but should be "Hybrid"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function fixHybridFuelTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the Lexus IS 300h (GX65LZP) that's incorrectly marked as Electric
    const car = await Car.findOne({ registrationNumber: 'GX65LZP' });

    if (!car) {
      console.log('❌ Car GX65LZP not found in database');
      process.exit(0);
    }

    console.log('\n📊 Current Car Data:');
    console.log('  Registration:', car.registrationNumber);
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Fuel Type:', car.fuelType);
    console.log('  Electric Range:', car.electricRange);
    console.log('  Battery Capacity:', car.batteryCapacity);

    // Check if it's incorrectly marked as Electric
    if (car.fuelType === 'Electric' && car.make === 'LEXUS' && car.model.includes('300')) {
      console.log('\n🔧 FIXING: This is a Hybrid, not Electric!');
      
      // Update fuel type to Hybrid
      car.fuelType = 'Hybrid';
      
      // Remove electric-only fields (hybrids don't have these)
      car.electricRange = null;
      car.batteryCapacity = null;
      car.chargingTime = null;
      car.homeChargingSpeed = null;
      car.publicChargingSpeed = null;
      car.rapidChargingSpeed = null;
      car.chargingTime10to80 = null;
      car.electricMotorPower = null;
      car.electricMotorTorque = null;
      car.chargingPortType = null;
      car.fastChargingCapability = null;
      
      // Also clear from runningCosts object
      if (car.runningCosts) {
        car.runningCosts.electricRange = null;
        car.runningCosts.batteryCapacity = null;
        car.runningCosts.chargingTime = null;
        car.runningCosts.homeChargingSpeed = null;
        car.runningCosts.publicChargingSpeed = null;
        car.runningCosts.rapidChargingSpeed = null;
        car.runningCosts.chargingTime10to80 = null;
        car.runningCosts.electricMotorPower = null;
        car.runningCosts.electricMotorTorque = null;
        car.runningCosts.chargingPortType = null;
        car.runningCosts.fastChargingCapability = null;
      }
      
      await car.save();
      
      console.log('\n✅ FIXED! Updated Car Data:');
      console.log('  Fuel Type:', car.fuelType);
      console.log('  Electric Range:', car.electricRange);
      console.log('  Battery Capacity:', car.batteryCapacity);
      console.log('\n🎉 Lexus IS 300h is now correctly classified as Hybrid!');
    } else {
      console.log('\n✅ Car fuel type is already correct:', car.fuelType);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixHybridFuelTypes();
