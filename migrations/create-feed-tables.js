/**
 * Database migration for Stock Feed Import System (MongoDB)
 * This creates indexes for the feed models
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function createFeedIndexes() {
  try {
    // Connect to database
    await connectDB();

    // Import models (this will create collections and indexes)
    const DealerFeed = require('../models/DealerFeed');
    const FeedVehicle = require('../models/FeedVehicle');
    const FeedImage = require('../models/FeedImage');
    const FeedLog = require('../models/FeedLog');

    // Ensure indexes are created
    await Promise.all([
      DealerFeed.createIndexes(),
      FeedVehicle.createIndexes(),
      FeedImage.createIndexes(),
      FeedLog.createIndexes()
    ]);
    return true;

  } catch (error) {
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  createFeedIndexes()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = createFeedIndexes;
