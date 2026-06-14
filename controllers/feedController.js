const feedImportService = require('../services/feedImportService');
const DealerFeed = require('../models/DealerFeed');

/**
 * Test feed connection
 */
exports.testFeed = async (req, res) => {
  try {
    const { feedUrl } = req.body;

    if (!feedUrl) {
      return res.status(400).json({
        success: false,
        message: 'Feed URL is required'
      });
    }

    const result = await feedImportService.testFeed(feedUrl);

    res.json(result);

  } catch (error) {
    console.error('Error testing feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test feed',
      error: error.message
    });
  }
};

/**
 * Import stock from feed
 */
exports.importFeed = async (req, res) => {
  try {
    // Get dealerId from authenticated session
    const dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }
    
    const { feedUrl, removeSoldVehicles, importImages } = req.body;

    if (!feedUrl) {
      return res.status(400).json({
        success: false,
        message: 'Feed URL is required'
      });
    }

    const result = await feedImportService.importFeed(dealerId, feedUrl, {
      removeSoldVehicles: removeSoldVehicles !== false,
      importImages: importImages !== false,
      createCarListings: true
    });

    res.json({
      success: true,
      message: `Successfully imported ${result.stats.vehicles_imported} vehicles`,
      stats: result.stats,
      provider: result.provider,
      format: result.format,
      duration: result.duration
    });

  } catch (error) {
    console.error('Error importing feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import feed',
      error: error.message
    });
  }
};

/**
 * Get dealer feeds
 */
exports.getDealerFeeds = async (req, res) => {
  try {
    const dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }

    const feeds = await feedImportService.getDealerFeeds(dealerId);

    res.json({
      success: true,
      feeds
    });

  } catch (error) {
    console.error('Error fetching dealer feeds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dealer feeds',
      error: error.message
    });
  }
};

/**
 * Update feed settings
 */
exports.updateFeed = async (req, res) => {
  try {
    const dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }
    
    const { feedId } = req.params;
    const { autoImportEnabled, syncIntervalMinutes, removeSoldVehicles, importImages } = req.body;

    const feed = await DealerFeed.findOne({
      _id: feedId,
      dealerId
    });

    if (!feed) {
      return res.status(404).json({
        success: false,
        message: 'Feed not found'
      });
    }

    await DealerFeed.findByIdAndUpdate(feedId, {
      autoImportEnabled,
      syncIntervalMinutes,
      removeSoldVehicles,
      importImages
    });

    const updatedFeed = await DealerFeed.findById(feedId);

    res.json({
      success: true,
      message: 'Feed settings updated',
      feed: updatedFeed
    });

  } catch (error) {
    console.error('Error updating feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feed',
      error: error.message
    });
  }
};

/**
 * Delete feed
 */
exports.deleteFeed = async (req, res) => {
  try {
    const dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }
    
    const { feedId } = req.params;

    const feed = await DealerFeed.findOne({
      _id: feedId,
      dealerId
    });

    if (!feed) {
      return res.status(404).json({
        success: false,
        message: 'Feed not found'
      });
    }

    await DealerFeed.findByIdAndDelete(feedId);

    res.json({
      success: true,
      message: 'Feed deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feed',
      error: error.message
    });
  }
};

/**
 * Get feed logs
 */
exports.getFeedLogs = async (req, res) => {
  try {
    const dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }
    
    const { limit } = req.query;

    const logs = await feedImportService.getFeedLogs(dealerId, parseInt(limit) || 20);

    res.json({
      success: true,
      logs
    });

  } catch (error) {
    console.error('Error fetching feed logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed logs',
      error: error.message
    });
  }
};

/**
 * Manually trigger feed sync
 */
exports.syncFeed = async (req, res) => {
  try {
    const dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }
    
    const { feedId } = req.params;

    const feed = await DealerFeed.findOne({
      _id: feedId,
      dealerId
    });

    if (!feed) {
      return res.status(404).json({
        success: false,
        message: 'Feed not found'
      });
    }

    const result = await feedImportService.importFeed(dealerId, feed.feedUrl, {
      removeSoldVehicles: feed.removeSoldVehicles,
      importImages: feed.importImages,
      createCarListings: true
    });

    res.json({
      success: true,
      message: 'Feed synced successfully',
      stats: result.stats
    });

  } catch (error) {
    console.error('Error syncing feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync feed',
      error: error.message
    });
  }
};
