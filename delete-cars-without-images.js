/**
 * Delete all cars from database that don't have images
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('./models/Car');

async function deleteCarsWithoutImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars without images
    // Cars without images: empty array [] or null/undefined
    const carsWithoutImages = await Car.find({
      $or: [
        { images: { $exists: false } },
        { images: null },
        { images: { $size: 0 } }
      ]
    });

    console.log(`\n📊 Found ${carsWithoutImages.length} cars without images`);

    if (carsWithoutImages.length === 0) {
      console.log('✅ No cars to delete!');
      process.exit(0);
    }

    // Show preview
    console.log('\n🔍 Preview of cars to be deleted:');
    carsWithoutImages.slice(0, 10).forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model} ${car.year || ''} - ID: ${car._id}`);
    });

    if (carsWithoutImages.length > 10) {
      console.log(`... and ${carsWithoutImages.length - 10} more`);
    }

    // Delete all cars without images
    const result = await Car.deleteMany({
      $or: [
        { images: { $exists: false } },
        { images: null },
        { images: { $size: 0 } }
      ]
    });

    console.log(`\n✅ Successfully deleted ${result.deletedCount} cars without images!`);

    // Show remaining count
    const remainingCount = await Car.countDocuments();
    console.log(`📊 Remaining cars in database: ${remainingCount}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the cleanup
deleteCarsWithoutImages();
