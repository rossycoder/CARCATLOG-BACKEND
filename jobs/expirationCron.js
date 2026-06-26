const cron = require('node-cron');
const expirationService = require('../services/expirationService');
const { runDailyCleanup } = require('./cleanupPendingCars');
const CallSession = require('../models/CallSession');
const PhoneNumberPool = require('../models/PhoneNumberPool');

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
    }
  });

};

/**
 * Cron job to release expired call session proxy numbers back to pool
 * Runs every 5 minutes
 */
const startCallSessionCleanupCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expiredSessions = await CallSession.find({
        status: 'active',
        expiresAt: { $lt: new Date() }
      }).select('proxyNumber');

      if (expiredSessions.length === 0) return;

      const proxyNumbers = expiredSessions.map(s => s.proxyNumber);

      await PhoneNumberPool.updateMany(
        { proxyNumber: { $in: proxyNumbers } },
        { $set: { status: 'available' } }
      );

      await CallSession.updateMany(
        { status: 'active', expiresAt: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      );

      console.log(`✅ Released ${proxyNumbers.length} proxy number(s) back to pool`);
    } catch (error) {
    }
  });
};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  startExpirationCron();
  startWarningCron();
  startCleanupCron();
  startCallSessionCleanupCron();
};

module.exports = {
  initializeCronJobs,
  startExpirationCron,
  startWarningCron,
  startCleanupCron,
  startCallSessionCleanupCron
};
