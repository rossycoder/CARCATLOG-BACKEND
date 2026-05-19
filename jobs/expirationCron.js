const cron = require('node-cron');
const expirationService = require('../services/expirationService');
const { runDailyCleanup } = require('./cleanupPendingCars');

/**
 * Cron job to check and expire listings
 * Runs every hour to immediately move expired cars to draft
 */
const startExpirationCron = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const results = await expirationService.expireListings();
    } catch (error) {
      console.error('Error in expiration cron job:', error);
    }
  });

};

/**
 * Cron job to send expiration warnings
 * Runs every day at 9:00 AM
 */
const startWarningCron = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      const results = await expirationService.sendExpirationWarnings(3);
    } catch (error) {
      console.error('Error in warning cron job:', error);
    }
  });

};

/**
 * Cron job to cleanup pending payment cars
 * Runs every day at 3:00 AM (after expiration check)
 * Deletes cars that were created but payment was never completed
 */
const startCleanupCron = () => {
  // Run daily at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    try {
      const results = await runDailyCleanup();
    } catch (error) {
      console.error('Error in cleanup cron job:', error);
    }
  });

};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  startExpirationCron();
  startWarningCron();
  startCleanupCron(); // NEW: Cleanup pending payment cars
  
};

module.exports = {
  initializeCronJobs,
  startExpirationCron,
  startWarningCron,
  startCleanupCron
};
