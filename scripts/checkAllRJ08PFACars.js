require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find ALL cars with this registration
    const cars = await Car.find({
      registrationNumber: 'RJ08PFA'
    }).sort({ createdAt: -1 });

    console.log(`\n📊 Found ${cars.length} car(s) with registration RJ08PFA:\n`);

    cars.forEach((car, index) => {
      console.log(`Car #${index + 1}:`);
      console.log(`   MongoDB ID: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Make/Model: ${car.make} ${car.model} ${car.variant || ''}`);
      console.log(`   Price: £${car.price}`);
      console.log(`   Images: ${car.images.length}`);
      console.log(`   Postcode: ${car.postcode || car.sellerContact?.postcode || 'N/A'}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log(`   Published: ${car.publishedAt || 'Not published'}`);
      console.log('');
    });

    // Also check the specific ID from your JSON
    const specificCar = await Car.findById('697a0b1ed030d09979bd9cc8');
    if (specificCar) {
      console.log(`\n🔍 Car with ID 697a0b1ed030d09979bd9cc8:`);
      console.log(`   Status: ${specificCar.advertStatus}`);
      console.log(`   Registration: ${specificCar.registrationNumber}`);
      console.log(`   Make/Model: ${specificCar.make} ${specificCar.model}`);
      console.log(`   Postcode: ${specificCar.postcode || specificCar.sellerContact?.postcode || 'N/A'}`);
    } else {
      console.log(`\n❌ Car with ID 697a0b1ed030d09979bd9cc8 not found`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllCars();
