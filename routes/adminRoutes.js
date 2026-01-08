const express = require('express');
const router = express.Router();
const expirationService = require('../services/expirationService');

/**
 * Manual trigger for expiration check (admin only)
 */
router.post('/expire-listings', async (req, res) => {
  try {
    const results = await expirationService.expireListings();
    res.json({
      success: true,
      message: 'Expiration check completed',
      results
    });
  } catch (error) {
    console.error('Error in manual expiration trigger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to expire listings',
      error: error.message
    });
  }
});

/**
 * Manual trigger for expiration warnings
 */
router.post('/send-warnings', async (req, res) => {
  try {
    const daysBeforeExpiry = req.body.days || 3;
    const results = await expirationService.sendExpirationWarnings(daysBeforeExpiry);
    res.json({
      success: true,
      message: 'Warnings sent',
      results
    });
  } catch (error) {
    console.error('Error in manual warning trigger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send warnings',
      error: error.message
    });
  }
});

/**
 * Get expiration statistics
 */
router.get('/expiration-stats', async (req, res) => {
  try {
    const stats = await expirationService.getExpirationStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting expiration stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

/**
 * Manual cleanup of old expired listings
 */
router.post('/cleanup-expired', async (req, res) => {
  try {
    const daysOld = req.body.daysOld || 90;
    const results = await expirationService.cleanupOldExpiredListings(daysOld);
    res.json({
      success: true,
      message: 'Cleanup completed',
      deletedCount: results.deletedCount
    });
  } catch (error) {
    console.error('Error in manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup',
      error: error.message
    });
  }
});

module.exports = router;
