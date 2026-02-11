require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function checkVideoUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars with videoUrl
    const carsWithVideo = await Car.find({ 
      videoUrl: { $exists: true, $ne: '', $ne: null } 
    }).select('_id make model year videoUrl');

    console.log(`\n📊 Found ${carsWithVideo.length} cars with video URLs:\n`);
    
    if (carsWithVideo.length > 0) {
      carsWithVideo.forEach(car => {
        console.log(`🚗 ${car.year} ${car.make} ${car.model}`);
        console.log(`   ID: ${car._id}`);
        console.log(`   Video: ${car.videoUrl}`);
        console.log(`   URL: http://localhost:5173/cars/${car._id}\n`);
      });
    } else {
      console.log('❌ No cars found with video URLs');
      console.log('\n💡 To test the feature:');
      console.log('1. Go to any car advert edit page');
      console.log('2. Add a YouTube URL in the "Advert video" section');
      console.log('3. Save and view the car detail page');
    }

    // Also check total cars
    const totalCars = await Car.countDocuments();
    console.log(`\n📈 Total cars in database: ${totalCars}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkVideoUrls();
