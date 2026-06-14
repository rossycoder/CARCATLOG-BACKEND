const cron = require('node-cron');
const DealerFeed = require('../models/DealerFeed');
const feedImportService = require('../services/feedImportService');

/**
 * Automatic feed synchronization cron job
 * Runs every 15 minutes and syncs all active feeds
 */
class FeedSyncCron {
  
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
  }

  /**
   * Start the cron job
   */
  start() {
    if (this.cronJob) {
      console.log('Feed sync cron is already running');
      return;
    }

    // Run every 15 minutes: */15 * * * *
    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      await this.syncAllFeeds();
    });

    console.log('✓ Feed sync cron job started (runs every 15 minutes)');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Feed sync cron job stopped');
    }
  }

  /**
   * Sync all active feeds
   */
  async syncAllFeeds() {
    if (this.isRunning) {
      console.log('Feed sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('\n--- Starting feed sync job ---');

    try {
      // Find all active feeds that need syncing
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const feeds = await DealerFeed.find({
        status: 'active',
        autoImportEnabled: true,
        $or: [
          { lastSync: null },
          { lastSync: { $lt: fifteenMinutesAgo } }
        ]
      });

      console.log(`Found ${feeds.length} feeds to sync`);

      let successCount = 0;
      let errorCount = 0;

      // Process each feed
      for (const feed of feeds) {
        try {
          console.log(`\nSyncing feed ${feed._id} for dealer ${feed.dealerId}...`);
          
          const result = await feedImportService.importFeed(
            feed.dealerId,
            feed.feedUrl,
            {
              removeSoldVehicles: feed.removeSoldVehicles,
              importImages: feed.importImages,
              createCarListings: true
            }
          );

          console.log(`✓ Feed ${feed._id} synced successfully:`, {
            imported: result.stats.vehicles_imported,
            updated: result.stats.vehicles_updated,
            archived: result.stats.vehicles_archived
          });

          successCount++;

        } catch (error) {
          console.error(`✗ Error syncing feed ${feed._id}:`, error.message);
          
          // Update feed status to error
          await DealerFeed.findByIdAndUpdate(feed._id, {
            status: 'error'
          });

          errorCount++;
        }
      }

      console.log('\n--- Feed sync job completed ---');
      console.log(`Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      console.error('Error in feed sync cron:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger sync for testing
   */
  async manualSync() {
    await this.syncAllFeeds();
  }
}

const feedSyncCron = new FeedSyncCron();

module.exports = feedSyncCron;
