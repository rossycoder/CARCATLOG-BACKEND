/**
 * Update BMW i4 Drive Type
 * Adds driveType field to BMW i4 vehicles
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');

async function updateBMWi4DriveType() {
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
      
      // BMW i4 M50 is AWD, eDrive40 is RWD
      let driveType = 'RWD'; // Default for eDrive40
      
      if (car.variant && car.variant.toLowerCase().includes('m50')) {
        driveType = 'AWD'; // M50 is all-wheel drive
      }
      
      await Car.findByIdAndUpdate(car._id, { driveType });
      
      console.log(`✅ Updated driveType: ${driveType}`);
    }
    
    console.log(`\n🎉 Successfully updated ${bmwI4Cars.length} BMW i4 vehicles with driveType!`);
    
  } catch (error) {
    console.error('❌ Error updating BMW i4 driveType:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  updateBMWi4DriveType();
}

module.exports = { updateBMWi4DriveType };