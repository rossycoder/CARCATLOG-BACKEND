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
  // Declare outside try so catch block can reference them for logging
  let feedUrl;
  let dealerId;
  let result;
  try {
    // ═══════════════════════════════════════════════════════════════════════
    // 🔍 DIAGNOSTIC LOGGING - Track frontend requests
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(80));
    console.log('📥 FRONTEND IMPORT REQUEST RECEIVED');
    console.log('═'.repeat(80));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔐 Dealer ID:', req.dealerId || req.dealer?.id || 'NOT FOUND');
    console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('═'.repeat(80) + '\n');
    
    // Get dealerId from authenticated session
    dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      console.error('❌ No dealer ID found in request\n');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }
    
    let removeSoldVehicles, importImages, useUnsplashFallback, limitVehicles, selectionMode;
    ({ 
      feedUrl, 
      removeSoldVehicles, 
      importImages, 
      useUnsplashFallback, 
      limitVehicles, 
      selectionMode 
    } = req.body);

    if (!feedUrl) {
      console.error('❌ No feed URL provided\n');
      return res.status(400).json({
        success: false,
        message: 'Feed URL is required'
      });
    }

    console.log('✅ Starting import with options:', {
      removeSoldVehicles: removeSoldVehicles !== false,
      importImages: importImages !== false,
      useUnsplashFallback: useUnsplashFallback === true,
      limitVehicles: limitVehicles === true,
      selectionMode: selectionMode || 'first'
    });
    console.log();

    // ── Get dealer settings to check if API enrichment is enabled ──
    const TradeDealer = require('../models/TradeDealer');
    const dealer = await TradeDealer.findById(dealerId).select('settings');
    
    // ✅ DEFAULT TO ENABLED - only disable if explicitly set to false
    const enableAPIEnrichment = dealer?.settings?.enableAPIEnrichment !== false;
    
    if (enableAPIEnrichment) {
      console.log('✅ API Enrichment ENABLED for this dealer (default)');
    } else {
      console.log('⏭️  API Enrichment DISABLED (explicitly disabled by dealer)');
    }

    // ALWAYS use enhanced import with Cloudinary upload
    // Enhanced import properly downloads images from any source and uploads to Cloudinary
    result = await feedImportService.importFeedEnhanced(dealerId, feedUrl, {
      removeSoldVehicles: false, // ← ← ← MOST IMPORTANT — cars DELETE nahi honge, sirf sold mark
      importImages: importImages !== false,
      useUnsplashFallback: useUnsplashFallback === true,
      limitVehicles: limitVehicles === true,
      selectionMode: selectionMode || 'first',
      uploadToCloudinary: true, // ✅ Always upload to Cloudinary
      createCarListings: true,
      enableAPIEnrichment: enableAPIEnrichment, // 🆕 Smart API enrichment with cost control
      onlyEnrichNewCars: false, // ✅ First import: enrich ALL cars
      isFirstImport: true // ✅ Flag for first import
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log('📊 IMPORT COMPLETED');
    console.log('─'.repeat(80));
    console.log('✅ Success:', result.success);
    console.log('📈 Stats:', JSON.stringify(result.stats, null, 2));
    console.log('─'.repeat(80) + '\n');

    const response = {
      success: true,
      message: result.stats.vehicles_imported > 0 || result.stats.vehicles_updated > 0 
        ? `Successfully imported ${result.stats.vehicles_imported} vehicles` 
        : `No vehicles imported`,
      stats: result.stats,
      provider: result.provider,
      format: result.format,
      duration: result.duration
    };

    // Add enhanced features info if applicable
    if (result.limitApplied) {
      response.limitApplied = true;
      response.message += `. Subscription limit was applied using ${selectionMode} selection.`;
    }
    
    if (result.unsplashImagesUsed > 0) {
      response.unsplashImagesUsed = result.unsplashImagesUsed;
      response.message += ` ${result.unsplashImagesUsed} professional images were added automatically.`;
    }

    res.json(response);

  } catch (error) {
    console.error('\n' + '═'.repeat(80));
    console.error('❌ IMPORT FAILED - ERROR DETAILS');
    console.error('═'.repeat(80));
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Feed URL:', feedUrl);
    console.error('Dealer ID:', dealerId);
    console.error('═'.repeat(80) + '\n');
    
    // Send detailed error to frontend
    res.status(500).json({
      success: false,
      message: 'Failed to import feed',
      error: error.message,
      details: {
        feedUrl,
        dealerId,
        timestamp: new Date().toISOString()
      }
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
    
    // Accept both snake_case (from frontend) and camelCase
    const { 
      autoImportEnabled, 
      auto_import_enabled,
      syncIntervalMinutes, 
      removeSoldVehicles, 
      importImages 
    } = req.body;

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

    // Build update object dynamically
    const updateData = {};
    
    // Handle autoImportEnabled (accept both formats)
    if (autoImportEnabled !== undefined) {
      updateData.autoImportEnabled = autoImportEnabled;
    } else if (auto_import_enabled !== undefined) {
      updateData.autoImportEnabled = auto_import_enabled;
    }
    
    if (syncIntervalMinutes !== undefined) {
      updateData.syncIntervalMinutes = syncIntervalMinutes;
    }
    if (removeSoldVehicles !== undefined) {
      updateData.removeSoldVehicles = removeSoldVehicles;
    }
    if (importImages !== undefined) {
      updateData.importImages = importImages;
    }

    await DealerFeed.findByIdAndUpdate(feedId, updateData);

    const updatedFeed = await DealerFeed.findById(feedId);

    console.log(`✅ Feed ${feedId} updated - Auto-import: ${updatedFeed.autoImportEnabled}`);

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
  console.log('\n' + '═'.repeat(80));
  console.log('📥 [syncFeed] REQUEST RECEIVED');
  console.log('═'.repeat(80));
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('═'.repeat(80) + '\n');
  
  try {
    const dealerId = req.dealerId || req.dealer?.id;
    
    if (!dealerId) {
      console.log('❌ [syncFeed] No dealer ID found\n');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Dealer authentication required'
      });
    }
    
    const { feedId } = req.params;
    console.log(`✅ [syncFeed] Processing sync for feedId: ${feedId}, dealerId: ${dealerId}`);

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

    // ✅ Same enhanced logic as "Import Stock" — subscription limits,
    // robust image handling, proper per-vehicle error tracking.
    // 🔄 SYNC MODE: Process sold vehicles to update their status (isFirstImport: false)
    
    // ── Check dealer settings for API enrichment ──
    // 🆕 SMART SYNC: Call APIs only for NEW cars (not existing ones)
    const TradeDealer = require('../models/TradeDealer');
    const dealer = await TradeDealer.findById(dealerId).select('settings');
    
    // ✅ DEFAULT TO ENABLED - only disable if explicitly set to false
    const dealerHasAPIEnabled = dealer?.settings?.enableAPIEnrichment !== false;
    
    // ✅ Enable API enrichment for NEW cars during sync (if dealer has it enabled)
    const enableAPIEnrichmentForSync = dealerHasAPIEnabled;
    
    if (enableAPIEnrichmentForSync) {
      console.log('✅ [Sync Now] API Enrichment ENABLED for NEW cars (default)');
      console.log('   💡 Existing cars: price/status update only (no API)');
      console.log('   💡 New cars: full API enrichment (specs, MOT, history)');
    } else {
      console.log('⏭️  [Sync Now] API Enrichment DISABLED (explicitly disabled by dealer)');
    }
    
    console.log(`\n🔄 [syncFeed] Starting feed import with options:`, {
      dealerHasAPIEnabled,
      enableAPIEnrichmentForSync,
      removeSoldVehicles: false, // ← ← ← IMPORTANT: sirf sold mark, delete nahi
      importImages: feed.importImages !== false
    });
    
    const result = await feedImportService.importFeedEnhanced(dealerId, feed.feedUrl, {
      removeSoldVehicles: false, // ← ← ← YE MOST IMPORTANT — cars DELETE nahi honge
      importImages: feed.importImages !== false,
      useUnsplashFallback: feed.useUnsplashFallback === true,
      createCarListings: true,
      isFirstImport: false, // 🔄 SYNC mode: update status of existing sold cars, don't skip them
      enableAPIEnrichment: enableAPIEnrichmentForSync, // ✅ Smart: only for NEW cars
      onlyEnrichNewCars: true // 🆕 Flag to only enrich new imports, not existing
    });
    
    console.log(`\n✅ [syncFeed] Import completed successfully`);
    console.log(`   Stats:`, JSON.stringify(result.stats, null, 2));

    const imported = result.stats.vehicles_imported || 0;
    const updated = result.stats.vehicles_updated || 0;
    const errors = result.stats.errors || [];
    const hasSucceeded = imported > 0 || updated > 0;

    const responseData = {
      success: hasSucceeded || errors.length === 0,
      message: hasSucceeded
        ? `Synced: ${imported} imported, ${updated} updated${errors.length > 0 ? `, ${errors.length} errors` : ''}`
        : errors.length > 0
          ? `Sync completed with ${errors.length} errors — nothing was imported or updated`
          : 'No changes — feed already up to date',
      stats: result.stats
    };

    console.log('\n' + '═'.repeat(80));
    console.log('📤 SENDING RESPONSE TO FRONTEND');
    console.log('═'.repeat(80));
    console.log(JSON.stringify(responseData, null, 2));
    console.log('═'.repeat(80) + '\n');

    res.json(responseData);

  } catch (error) {
    console.error('Error syncing feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync feed',
      error: error.message
    });
  }
};

/**
 * Test enhanced image processing
 */
exports.testImageProcessing = async (req, res) => {
  try {
    const { imageUrls, vehicleData } = req.body;

    if (!imageUrls && !vehicleData) {
      return res.status(400).json({
        success: false,
        message: 'Either imageUrls array or vehicleData object is required'
      });
    }

    const feedImageProcessor = require('../services/feedImageProcessor');
    
    let testVehicle = vehicleData || {
      images: imageUrls,
      make: 'BMW',
      model: '3 Series',
      year: '2022'
    };

    const results = await feedImageProcessor.processVehicleImages(testVehicle, {
      useUnsplashFallback: true,
      uploadToCloudinary: false // Don't upload during testing
    });

    res.json({
      success: true,
      results: {
        totalProcessed: results.totalProcessed,
        processedImages: results.processedImages,
        failedImages: results.failedImages,
        unsplashUsed: results.unsplashUsed
      },
      message: `Processed ${results.totalProcessed} images successfully`
    });

  } catch (error) {
    console.error('Error testing image processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test image processing',
      error: error.message
    });
  }
};
