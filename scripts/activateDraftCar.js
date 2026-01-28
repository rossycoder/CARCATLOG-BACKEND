require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateDraftCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the Honda Civic draft car
    const car = await Car.findOne({
      make: 'HONDA',
      model: 'Civic',
      registrationNumber: 'RJ08PFA',
      advertStatus: 'draft'
    });

    if (!car) {
      console.log('❌ Car not found with draft status');
      
      // Check if it already exists as active
      const activeCar = await Car.findOne({
        make: 'HONDA',
        model: 'Civic',
        registrationNumber: 'RJ08PFA'
      });
      
      if (activeCar) {
        console.log(`✅ Car already exists with status: ${activeCar.advertStatus}`);
        console.log(`   ID: ${activeCar._id}`);
        console.log(`   Advert ID: ${activeCar.advertId}`);
      }
      
      process.exit(0);
    }

    console.log(`\n📝 Found car:`);
    console.log(`   ID: ${car._id}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Current Status: ${car.advertStatus}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Images: ${car.images.length}`);

    if (car.advertStatus === 'active') {
      console.log(`\n✅ Car is already active!`);
      console.log(`   Published At: ${car.publishedAt}`);
      process.exit(0);
    }

    // Update status to active
    car.advertStatus = 'active';
    car.publishedAt = new Date();
    
    await car.save();

    console.log(`\n✅ Car activated successfully!`);
    console.log(`   New Status: ${car.advertStatus}`);
    console.log(`   Published At: ${car.publishedAt}`);
    console.log(`\n🎉 Your car should now be visible on the frontend!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateDraftCar();
