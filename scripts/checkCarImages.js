const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarImages() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const car = await Car.findOne({ registrationNumber: 'EX09MYY' });
    
    if (car) {
      console.log('\n📊 Car Details:');
      console.log('==================');
      console.log('ID:', car._id);
      console.log('Make/Model:', car.make, car.model);
      console.log('Registration:', car.registrationNumber);
      console.log('Images:', car.images);
      console.log('Images length:', car.images ? car.images.length : 0);
      
      if (car.images && car.images.length > 0) {
        console.log('\n🖼️ Image URLs:');
        car.images.forEach((img, index) => {
          console.log(`${index + 1}. ${img}`);
        });
      } else {
        console.log('❌ No images found for this car');
      }
    } else {
      console.log('❌ Car not found');
    }
    
    // Also check the latest car
    const latestCar = await Car.findOne({ advertStatus: 'active' }).sort({ createdAt: -1 });
    
    if (latestCar && latestCar._id.toString() !== car?._id.toString()) {
      console.log('\n📊 Latest Car Details:');
      console.log('==================');
      console.log('ID:', latestCar._id);
      console.log('Make/Model:', latestCar.make, latestCar.model);
      console.log('Registration:', latestCar.registrationNumber);
      console.log('Images:', latestCar.images);
      console.log('Images length:', latestCar.images ? latestCar.images.length : 0);
      
      if (latestCar.images && latestCar.images.length > 0) {
        console.log('\n🖼️ Latest Car Image URLs:');
        latestCar.images.forEach((img, index) => {
          console.log(`${index + 1}. ${img}`);
        });
      } else {
        console.log('❌ No images found for latest car');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCarImages();