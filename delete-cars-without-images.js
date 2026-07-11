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
    // Find all cars without images
    // Cars without images: empty array [] or null/undefined
    const carsWithoutImages = await Car.find({
      $or: [
        { images: { $exists: false } },
        { images: null },
        { images: { $size: 0 } }
      ]
    });
    if (carsWithoutImages.length === 0) {
      process.exit(0);
    }

    // Show preview
    carsWithoutImages.slice(0, 10).forEach((car, index) => {
    });

    if (carsWithoutImages.length > 10) {
    }

    // Delete all cars without images
    const result = await Car.deleteMany({
      $or: [
        { images: { $exists: false } },
        { images: null },
        { images: { $size: 0 } }
      ]
    });
    // Show remaining count
    const remainingCount = await Car.countDocuments();
    process.exit(0);

  } catch (error) {
    process.exit(1);
  }
}

// Run the cleanup
deleteCarsWithoutImages();
