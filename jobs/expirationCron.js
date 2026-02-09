const cron = require('node-cron');
const expirationService = require('../services/expirationService');
const { runDailyCleanup } = require('./cleanupPendingCars');

/**
 * Cron job to check and expire listings
 * Runs every day at 2:00 AM
 */
const startExpirationCron = () => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running expiration check cron job...');
    try {
      const results = await expirationService.expireListings();
      console.log('Expiration check completed:', results);
    } catch (error) {
      console.error('Error in expiration cron job:', error);
    }
  });

  console.log('Expiration cron job scheduled (daily at 2:00 AM)');
};

/**
 * Cron job to send expiration warnings
 * Runs every day at 9:00 AM
 */
const startWarningCron = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running expiration warning cron job...');
    try {
      const results = await expirationService.sendExpirationWarnings(3);
      console.log('Expiration warnings sent:', results);
    } catch (error) {
      console.error('Error in warning cron job:', error);
    }
  });

  console.log('Warning cron job scheduled (daily at 9:00 AM)');
};

/**
 * Cron job to cleanup pending payment cars
 * Runs every day at 3:00 AM (after expiration check)
 * Deletes cars that were created but payment was never completed
 */
const startCleanupCron = () => {
  // Run daily at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('Running pending payment cleanup cron job...');
    try {
      const results = await runDailyCleanup();
      console.log('Cleanup completed:', results);
    } catch (error) {
      console.error('Error in cleanup cron job:', error);
    }
  });

  console.log('Cleanup cron job scheduled (daily at 3:00 AM)');
};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  startExpirationCron();
  startWarningCron();
  startCleanupCron(); // NEW: Cleanup pending payment cars
  
  console.log('All cron jobs initialized');
};

module.exports = {
  initializeCronJobs,
  startExpirationCron,
  startWarningCron,
  startCleanupCron
};
