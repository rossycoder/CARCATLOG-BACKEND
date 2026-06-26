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
    }
  }

  /**
   * Sync all active feeds
   */
  async syncAllFeeds() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
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
      let successCount = 0;
      let errorCount = 0;

      // Process each feed
      for (const feed of feeds) {
        try {
          // ── Check dealer settings for API enrichment ──
          const TradeDealer = require('../models/TradeDealer');
          const dealer = await TradeDealer.findById(feed.dealerId).select('settings');
          const enableAPIForNewCars = dealer?.settings?.enableAPIEnrichment === true;
          
          const result = await feedImportService.importFeedEnhanced(
            feed.dealerId,
            feed.feedUrl,
            {
              removeSoldVehicles: feed.removeSoldVehicles,
              importImages: feed.importImages,
              createCarListings: true,
              isFirstImport: false, // Sync mode
              enableAPIEnrichment: enableAPIForNewCars, // ✅ Smart: only for NEW cars
              onlyEnrichNewCars: true // 🆕 Only enrich new cars, not existing
            }
          );
          successCount++;

        } catch (error) {
          // Update feed status to error
          await DealerFeed.findByIdAndUpdate(feed._id, {
            status: 'error'
          });

          errorCount++;
        }
      }
    } catch (error) {
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
