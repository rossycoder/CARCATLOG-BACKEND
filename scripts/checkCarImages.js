require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function checkCarImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all active cars
    const activeCars = await Car.find({ advertStatus: 'active' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Total Active Cars: ${activeCars.length}\n`);
    console.log('=' .repeat(100));

    for (const car of activeCars) {
      console.log(`\n🚗 ${car.make} ${car.model} (${car.year}) - ${car.registrationNumber}`);
      console.log(`   ID: ${car._id}`);
      console.log(`   Owner: ${car.userId?.name || 'N/A'} (${car.userId?.email || 'N/A'})`);
      console.log(`   Price: £${car.price || 'N/A'}`);
      
      // Check images
      if (car.images && car.images.length > 0) {
        console.log(`   ✅ HAS IMAGES: ${car.images.length} images`);
        console.log(`   📸 First image: ${car.images[0].substring(0, 80)}...`);
      } else {
        console.log(`   ❌ NO IMAGES`);
      }
      
      console.log(`   📅 Created: ${new Date(car.createdAt).toLocaleString()}`);
      console.log('-'.repeat(100));
    }

    // Summary
    const carsWithImages = activeCars.filter(c => c.images && c.images.length > 0);
    const carsWithoutImages = activeCars.filter(c => !c.images || c.images.length === 0);
    
    console.log('\n' + '='.repeat(100));
    console.log('SUMMARY:');
    console.log(`Total Active Cars: ${activeCars.length}`);
    console.log(`Cars WITH images: ${carsWithImages.length}`);
    console.log(`Cars WITHOUT images: ${carsWithoutImages.length}`);
    console.log('='.repeat(100));

    if (carsWithImages.length > 0) {
      console.log('\n📸 CARS WITH IMAGES:');
      carsWithImages.forEach(car => {
        console.log(`   - ${car.make} ${car.model} (${car.registrationNumber}) - ${car.images.length} images`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCarImages();
