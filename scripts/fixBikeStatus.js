const mongoose = require('mongoose');
require('dotenv').config();

const Bike = require('../models/Bike');

async function fixBikeStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('Connected to MongoDB');

    // Find all bikes
    const allBikes = await Bike.find({});
    console.log(`\nTotal bikes in database: ${allBikes.length}`);

    // Show status breakdown
    const statusCounts = {};
    allBikes.forEach(bike => {
      const status = bike.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('\nStatus breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Find bikes with coordinates
    const bikesWithCoords = allBikes.filter(b => 
      (b.latitude && b.longitude) || 
      (b.location?.coordinates?.length === 2)
    );
    console.log(`\nBikes with coordinates: ${bikesWithCoords.length}`);

    // Update all non-active bikes to active
    const result = await Bike.updateMany(
      { status: { $ne: 'active' } },
      { $set: { status: 'active' } }
    );
    console.log(`\nUpdated ${result.modifiedCount} bikes to active status`);

    // Verify
    const activeBikes = await Bike.countDocuments({ status: 'active' });
    console.log(`\nNow ${activeBikes} bikes have active status`);

    // Show sample bike
    const sampleBike = await Bike.findOne({ status: 'active' });
    if (sampleBike) {
      console.log('\nSample active bike:');
      console.log(`  ID: ${sampleBike._id}`);
      console.log(`  Make: ${sampleBike.make}`);
      console.log(`  Model: ${sampleBike.model}`);
      console.log(`  Status: ${sampleBike.status}`);
      console.log(`  Latitude: ${sampleBike.latitude}`);
      console.log(`  Longitude: ${sampleBike.longitude}`);
      console.log(`  Condition: ${sampleBike.condition}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixBikeStatus();
