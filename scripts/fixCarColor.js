const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixCarColor() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const carId = '6982517dd49cfacb5f246ff8';
    
    console.log('\n🎨 FIXING CAR COLOR');
    console.log('===================');
    
    // Find and update the car
    const car = await Car.findById(carId);
    
    if (car) {
      console.log('🚗 Car Found:');
      console.log('   Make/Model:', car.make, car.model);
      console.log('   Registration:', car.registrationNumber);
      console.log('   Current color:', `"${car.color}"`);
      
      // Update the color to BLACK
      car.color = 'BLACK';
      await car.save();
      
      console.log('\n✅ Color updated successfully!');
      console.log('   New color:', `"${car.color}"`);
      
      // Verify the update
      const updatedCar = await Car.findById(carId);
      console.log('\n🔍 Verification:');
      console.log('   Color in database:', `"${updatedCar.color}"`);
      console.log('   Frontend will now show:', updatedCar.color || 'Not specified');
      
    } else {
      console.log('❌ Car not found');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCarColor();