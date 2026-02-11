/**
 * Fix GX65LZP - Correct fuel type and electric range
 * 
 * Issue: Vehicle shows as "Electric" with 200 miles range
 * Reality: This is a Lexus IS 300h - a HYBRID vehicle (not pure electric)
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function fixGX65LZP() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const vrm = 'GX65LZP';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log(`❌ Car ${vrm} not found in database`);
      return;
    }
    
    console.log(`\n📝 Current car data for ${vrm}:`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Fuel Type: ${car.fuelType} ❌ WRONG`);
    console.log(`   Electric Range: ${car.electricRange} miles ❌ WRONG`);
    console.log(`   Engine Size: ${car.engineSize}L`);
    console.log(`   Variant: ${car.variant}`);
    console.log(`   Display Title: ${car.displayTitle}`);
    
    // Check VehicleHistory for correct data
    const history = await VehicleHistory.findOne({ vrm: vrm });
    
    if (history) {
      console.log(`\n📋 VehicleHistory data:`);
      console.log(`   Fuel Type: ${history.fuelType}`);
      console.log(`   Make/Model: ${history.make} ${history.model}`);
    }
    
    console.log(`\n🔧 Applying fixes...`);
    
    // FIX 1: Correct fuel type to Petrol Hybrid (more accurate than just "Hybrid")
    car.fuelType = 'Petrol Hybrid';
    console.log(`   ✅ Fuel type corrected: Electric → Petrol Hybrid`);
    
    // FIX 2: Remove electric range (hybrids don't have pure electric range)
    car.electricRange = null;
    car.runningCosts = car.runningCosts || {};
    car.runningCosts.electricRange = null;
    console.log(`   ✅ Electric range removed (not applicable for hybrids)`);
    
    // FIX 3: Remove other EV-specific fields
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
    
    if (car.runningCosts) {
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
    console.log(`   ✅ EV-specific fields removed`);
    
    // FIX 4: Update VehicleHistory if needed
    if (history && (history.fuelType === 'Electric' || history.fuelType === 'Hybrid')) {
      history.fuelType = 'Petrol Hybrid';
      await history.save();
      console.log(`   ✅ VehicleHistory fuel type corrected to Petrol Hybrid`);
    }
    
    // Save the car
    await car.save();
    
    console.log(`\n✅ Car ${vrm} fixed successfully!`);
    console.log(`\n📝 Updated data:`);
    console.log(`   Fuel Type: ${car.fuelType} ✅`);
    console.log(`   Electric Range: ${car.electricRange || 'N/A'} ✅`);
    console.log(`   Display Title: ${car.displayTitle}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixGX65LZP();
