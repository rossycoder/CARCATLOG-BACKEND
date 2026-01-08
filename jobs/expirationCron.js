const cron = require('node-cron');
const expirationService = require('../services/expirationService');

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
 * Cron job to cleanup old expired listings
 * Runs once a week on Sunday at 3:00 AM
 */
const startCleanupCron = () => {
  // Run weekly on Sunday at 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('Running cleanup cron job...');
    try {
      const results = await expirationService.cleanupOldExpiredListings(90);
      console.log('Cleanup completed:', results);
    } catch (error) {
      console.error('Error in cleanup cron job:', error);
    }
  });

  console.log('Cleanup cron job scheduled (weekly on Sunday at 3:00 AM)');
};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  startExpirationCron();
  startWarningCron();
  startCleanupCron();
  
  console.log('All expiration cron jobs initialized');
};

module.exports = {
  initializeCronJobs,
  startExpirationCron,
  startWarningCron,
  startCleanupCron
};
