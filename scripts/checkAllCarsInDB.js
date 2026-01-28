require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allCars = await Car.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Total cars in database: ${allCars.length}\n`);

    allCars.forEach((car, index) => {
      console.log(`Car #${index + 1}:`);
      console.log(`   MongoDB ID: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Make/Model: ${car.make} ${car.model} ${car.variant || ''}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Price: £${car.price}`);
      console.log(`   Images: ${car.images.length}`);
      console.log(`   Postcode: ${car.postcode || 'N/A'}`);
      console.log(`   Coordinates: ${car.latitude ? `${car.latitude}, ${car.longitude}` : 'NOT SET'}`);
      console.log(`   User ID: ${car.userId || 'NOT SET'}`);
      console.log(`   Created: ${car.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });

    // Count by status
    const activeCount = await Car.countDocuments({ advertStatus: 'active' });
    const draftCount = await Car.countDocuments({ advertStatus: 'draft' });
    const incompleteCount = await Car.countDocuments({ advertStatus: 'incomplete' });

    console.log('📈 Summary:');
    console.log(`   Active: ${activeCount}`);
    console.log(`   Draft: ${draftCount}`);
    console.log(`   Incomplete: ${incompleteCount}`);
    console.log(`   Total: ${allCars.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllCars();
