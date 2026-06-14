/**
 * Database migration for Stock Feed Import System (MongoDB)
 * This creates indexes for the feed models
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function createFeedIndexes() {
  try {
    console.log('Creating stock feed indexes...');

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

    console.log('✓ Created DealerFeed collection with indexes');
    console.log('✓ Created FeedVehicle collection with indexes');
    console.log('✓ Created FeedImage collection with indexes');
    console.log('✓ Created FeedLog collection with indexes');

    console.log('\n✓ All stock feed collections created successfully!');
    
    return true;

  } catch (error) {
    console.error('Error creating feed collections:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  createFeedIndexes()
    .then(() => {
      console.log('\nMigration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration failed:', error);
      process.exit(1);
    });
}

module.exports = createFeedIndexes;
