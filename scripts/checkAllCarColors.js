const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAllCarColors() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🎨 CHECKING ALL CAR COLORS');
    console.log('==========================');
    
    // Find all cars and check their colors
    const cars = await Car.find({}).select('make model registrationNumber color').limit(10);
    
    console.log(`Found ${cars.length} cars:`);
    console.log('');
    
    cars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   Color: "${car.color}"`);
      console.log('');
    });
    
    // Check for cars with actual color values (not "Not specified")
    const carsWithColors = await Car.find({ 
      color: { $exists: true, $ne: 'Not specified', $ne: null, $ne: '' } 
    }).select('make model registrationNumber color').limit(5);
    
    console.log('\n🌈 CARS WITH ACTUAL COLORS:');
    console.log('============================');
    
    if (carsWithColors.length > 0) {
      carsWithColors.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log(`   Color: "${car.color}"`);
        console.log('');
      });
    } else {
      console.log('❌ No cars found with actual color values');
    }
    
    // Check the specific car that should have BLACK color
    console.log('\n🔍 SPECIFIC CAR CHECK:');
    console.log('======================');
    
    const specificCar = await Car.findById('6982517dd49cfacb5f246ff8');
    if (specificCar) {
      console.log('Car:', specificCar.make, specificCar.model);
      console.log('Registration:', specificCar.registrationNumber);
      console.log('Current color:', `"${specificCar.color}"`);
      console.log('');
      console.log('💡 This car should have color "BLACK" but shows "Not specified"');
      console.log('   This suggests the color was not properly set during car creation');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllCarColors();