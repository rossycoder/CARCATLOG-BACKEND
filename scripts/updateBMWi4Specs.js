/**
 * Update BMW i4 Specifications
 * Updates existing BMW i4 vehicles with correct charging specifications
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');

async function updateBMWi4Specs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    // Find BMW i4 vehicles
    const bmwI4Cars = await Car.find({
      make: 'BMW',
      model: 'i4',
      fuelType: 'Electric'
    });
    
    console.log(`\n🔍 Found ${bmwI4Cars.length} BMW i4 vehicles to update`);
    
    for (const car of bmwI4Cars) {
      console.log(`\n🚗 Updating: ${car.make} ${car.model} ${car.variant} (${car.registrationNumber})`);
      
      // Correct BMW i4 specifications
      const correctSpecs = {
        // Update individual fields
        homeChargingSpeed: 7.4, // More realistic UK home charging
        rapidChargingSpeed: 100, // BMW i4 actual rapid charging spec
        chargingTime10to80: 45, // More realistic rapid charging time
        fastChargingCapability: 'CCS Rapid Charging up to 100kW',
        
        // Update running costs object
        'runningCosts.homeChargingSpeed': 7.4,
        'runningCosts.rapidChargingSpeed': 100,
        'runningCosts.chargingTime10to80': 45,
        'runningCosts.fastChargingCapability': 'CCS Rapid Charging up to 100kW'
      };
      
      await Car.findByIdAndUpdate(car._id, correctSpecs);
      
      console.log(`✅ Updated specifications:`);
      console.log(`   - Home charging: 7.4kW (was ${car.homeChargingSpeed || car.runningCosts?.homeChargingSpeed}kW)`);
      console.log(`   - Rapid charging: 100kW (was ${car.rapidChargingSpeed || car.runningCosts?.rapidChargingSpeed}kW)`);
      console.log(`   - Rapid charging time: 45min (was ${car.chargingTime10to80 || car.runningCosts?.chargingTime10to80}min)`);
    }
    
    console.log(`\n🎉 Successfully updated ${bmwI4Cars.length} BMW i4 vehicles with correct specifications!`);
    
  } catch (error) {
    console.error('❌ Error updating BMW i4 specifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  updateBMWi4Specs();
}

module.exports = { updateBMWi4Specs };