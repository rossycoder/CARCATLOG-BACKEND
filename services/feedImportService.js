const feedFetcher = require('./feedFetcher');
const feedProviderDetector = require('./feedProviderDetector');
const feedMapper = require('./feedMapper');
const feedImageService = require('./feedImageService'); // Enhanced image service (replaces feedImageProcessor too)
const DealerFeed = require('../models/DealerFeed');
const FeedVehicle = require('../models/FeedVehicle');
const FeedLog = require('../models/FeedLog');
const FeedImage = require('../models/FeedImage');
const Car = require('../models/Car');

class FeedImportService {

  /**
   * Test feed connection
   */
  async testFeed(feedUrl) {
    try {
      const testResult = await feedFetcher.testFeed(feedUrl);
      if (!testResult.success) {
        return { success: false, error: testResult.error };
      }

      const provider = feedProviderDetector.detect(testResult.preview, testResult.format);
      const mappedVehicles = feedMapper.mapVehicles(testResult.preview, testResult.format, provider);
      const hasImages = mappedVehicles.some(v => v.images && v.images.length > 0);

      return {
        success: true,
        format: testResult.format,
        provider,
        vehicleCount: mappedVehicles.length,
        hasImages,
        duration: testResult.duration,
        preview: mappedVehicles.slice(0, 3),
        message: `Feed found! ${mappedVehicles.length} vehicles detected.`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Import stock from feed (one-time import)
   */
  async importFeed(dealerId, feedUrl, options = {}) {
    const startTime = Date.now();
    const stats = {
      vehicles_found: 0,
      vehicles_imported: 0,
      vehicles_updated: 0,
      vehicles_archived: 0,
      images_imported: 0,
      errors: []
    };

    try {
      const fetchResult = await feedFetcher.fetchFeed(feedUrl);
      if (!fetchResult.success) {
        throw new Error(`Failed to fetch feed: ${fetchResult.error}`);
      }

      const format = feedFetcher.detectFormat(fetchResult.data, fetchResult.contentType);
      if (format === 'unknown') {
        const dataPreview = typeof fetchResult.data === 'string'
          ? fetchResult.data.substring(0, 200)
          : JSON.stringify(fetchResult.data).substring(0, 200);
        throw new Error(`Could not detect feed format. Expected XML, CSV, or JSON. Data preview: ${dataPreview}`);
      }

      const parsedData = await feedFetcher.parseFeed(fetchResult.data, format);
      const provider = feedProviderDetector.detect(parsedData, format);
      const mappedVehicles = feedMapper.mapVehicles(parsedData, format, provider);
      stats.vehicles_found = mappedVehicles.length;

      if (mappedVehicles.length === 0) {
        console.error('❌ No vehicles found in feed!');
        console.error('   Feed URL:', feedUrl);
        console.error('   Format:', format);
        console.error('   Provider:', provider);
        console.error('   Parsed data keys:', typeof parsedData === 'object' ? Object.keys(parsedData) : 'not an object');
        console.error('   Parsed data type:', typeof parsedData);
        console.error('   Is array?:', Array.isArray(parsedData));
        throw new Error('No vehicles found in feed');
      }

      // 🚫 FILTER OUT SOLD VEHICLES ON NEW IMPORT
      // Only import active/available vehicles, skip sold ones
      const activeVehicles = mappedVehicles.filter(vehicle => {
        const normalizedStatus = this.normalizeAdvertStatus(vehicle.status);
        const isSold = normalizedStatus === 'sold';
        
        if (isSold) {
          console.log(`⏭️  Skipping sold vehicle on import: ${vehicle.make} ${vehicle.model} (${vehicle.stock_id})`);
        }
        
        return !isSold; // Only keep non-sold vehicles
      });
      
      console.log(`📊 Import filter: ${mappedVehicles.length} total vehicles, ${activeVehicles.length} active vehicles (skipped ${mappedVehicles.length - activeVehicles.length} sold vehicles)`);
      stats.vehicles_skipped_sold = mappedVehicles.length - activeVehicles.length;

      let dealerFeed = await DealerFeed.findOne({ dealerId, feedUrl });
      if (!dealerFeed) {
        dealerFeed = await DealerFeed.create({ dealerId, feedUrl, feedType: format, provider });
      }

      for (const mappedVehicle of activeVehicles) { // ✅ Use filtered activeVehicles (sold ones skipped)
        try {
          const result = await this.processVehicle(dealerId, dealerFeed._id, mappedVehicle, options);
          if (result.action === 'imported') stats.vehicles_imported++;
          if (result.action === 'updated') stats.vehicles_updated++;
          if (result.images) stats.images_imported += result.images;
        } catch (error) {
          stats.errors.push({ stockId: mappedVehicle.stock_id, error: error.message });
        }
      }

      if (options.removeSoldVehicles !== false) {
        const currentStockIds = activeVehicles.map(v => v.stock_id); // ✅ Use activeVehicles for archive check
        stats.vehicles_archived = await this.archiveMissingVehicles(dealerId, dealerFeed._id, currentStockIds);
      }

      await DealerFeed.findByIdAndUpdate(dealerFeed._id, { lastSync: new Date(), provider, status: 'active' });

      const duration = Date.now() - startTime;
      await FeedLog.create({
        dealerId,
        feedId: dealerFeed._id,
        status: stats.errors.length === 0 ? 'success' : 'partial',
        vehiclesFound: stats.vehicles_found,
        vehiclesImported: stats.vehicles_imported,
        vehiclesUpdated: stats.vehicles_updated,
        vehiclesArchived: stats.vehicles_archived,
        imagesImported: stats.images_imported,
        feedErrors: stats.errors,
        durationMs: duration
      });

      return { success: true, stats, duration, provider, format };

    } catch (error) {
      await FeedLog.create({
        dealerId,
        feedId: null,
        status: 'failed',
        vehiclesFound: stats.vehicles_found,
        vehiclesImported: stats.vehicles_imported,
        vehiclesUpdated: stats.vehicles_updated,
        errors: [{ error: error.message }],
        durationMs: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Enhanced import with advanced image processing and subscription limits
   */
  async importFeedEnhanced(dealerId, feedUrl, options = {}) {
    const startTime = Date.now();
    const stats = {
      vehicles_found: 0,
      vehicles_imported: 0,
      vehicles_updated: 0,
      vehicles_skipped: 0,
      vehicles_archived: 0,
      images_imported: 0,
      unsplash_images_used: 0,
      limit_applied: false,
      errors: []
    };

    try {
      // ── Auto-detect: naya feed = first import, existing = sync ──
      const existingFeed = await DealerFeed.findOne({ dealerId, feedUrl });
      const isFirstImport = options.isFirstImport !== undefined
        ? options.isFirstImport   // syncFeed explicitly false pass karta hai
        : !existingFeed;          // naya URL = true, pehle se exist = false
      
      console.log(`🔍 [Feed] Mode: ${isFirstImport ? 'FIRST IMPORT (sold skip)' : 'SYNC (sold update)'}`);

      const subscription = await this.checkSubscriptionLimits(dealerId);

      const fetchResult = await feedFetcher.fetchFeed(feedUrl);
      if (!fetchResult.success) {
        throw new Error(`Failed to fetch feed: ${fetchResult.error}`);
      }

      const format = feedFetcher.detectFormat(fetchResult.data, fetchResult.contentType);
      if (format === 'unknown') {
        throw new Error('Could not detect feed format. Expected XML, CSV, or JSON.');
      }

      const parsedData = await feedFetcher.parseFeed(fetchResult.data, format);
      const provider = feedProviderDetector.detect(parsedData, format);

      let mappedVehicles = feedMapper.mapVehicles(parsedData, format, provider);
      stats.vehicles_found = mappedVehicles.length;

      if (mappedVehicles.length === 0) {
        throw new Error('No vehicles found in feed');
      }

      // Apply subscription limits
      if (subscription.listingsLimit) {
        const currentUsage = await this.getCurrentListingUsage(dealerId);
        const availableSlots = Math.max(0, subscription.listingsLimit - currentUsage);
        const originalFeedCount = mappedVehicles.length; // Save original count for logging

        console.log(`🔒 [Feed Import] Subscription check:`, {
          plan: subscription.planName || 'Unknown',
          limit: subscription.listingsLimit,
          currentUsage: currentUsage,
          available: availableSlots,
          foundInFeed: originalFeedCount
        });

        if (availableSlots <= 0) {
          throw new Error(`Subscription limit reached. You have used ${currentUsage} out of ${subscription.listingsLimit} listings (including active, sold, and draft cars).`);
        }

        if (availableSlots < originalFeedCount) {
          const carsToIgnore = originalFeedCount - availableSlots; // Calculate BEFORE slicing
          
          console.log(`⚠️  [Feed Import] Applying limit: reducing from ${originalFeedCount} to ${availableSlots} vehicles`);
          console.log(`📊 [Feed Import] Current database count: ${currentUsage} cars (active + sold + draft)`);
          console.log(`🚫 [Feed Import] ${carsToIgnore} cars will be IGNORED (exceed limit)`);
          
          mappedVehicles = options.limitVehicles
            ? this.applyVehicleSelection(mappedVehicles, availableSlots, options.selectionMode)
            : mappedVehicles.slice(0, availableSlots);
          stats.limit_applied = true;
        }
      }

      let dealerFeed = existingFeed;
      if (!dealerFeed) {
        dealerFeed = await DealerFeed.create({ dealerId, feedUrl, feedType: format, provider });
      }

      for (const mappedVehicle of mappedVehicles) {
        try {
          // ═══════════════════════════════════════════════════════════════════
          // 🔄 SOLD VEHICLE HANDLING - Hook-bypass approach for reliable status updates
          // ═══════════════════════════════════════════════════════════════════
          const vehicleStatus = this.normalizeAdvertStatus(mappedVehicle.status);
          const isSold = vehicleStatus === 'sold';
          
          if (isSold) {
            if (isFirstImport) {
              console.log(`⏭️  [SKIP] Sold on first import: ${mappedVehicle.make} ${mappedVehicle.model}`);
              stats.vehicles_skipped++;
              continue;
            }
            
            // Sync mode — directly mark as sold, hooks bypass
            try {
              const orQuery = [];
              if (mappedVehicle.stock_id) orQuery.push({ stockId: String(mappedVehicle.stock_id) });
              if (mappedVehicle.registration) orQuery.push({ registrationNumber: mappedVehicle.registration });
              
              if (orQuery.length === 0) {
                console.log(`⚠️  [SOLD] No stockId or registration for: ${mappedVehicle.make}`);
                stats.vehicles_skipped++;
                continue;
              }
              
              console.log(`🔍 [SOLD] Looking for car:`, { dealerId, orQuery });
              
              // DEBUG: Check what cars exist for this dealer (enable if NOT FOUND issues occur)
              const DEBUG_MODE = true; // Set to false after issue is resolved
              if (DEBUG_MODE) {
                const existingCars = await Car.find({ 
                  dealerId, 
                  advertStatus: { $ne: 'sold' } 
                }).select('stockId registrationNumber make model advertStatus').limit(5);
                
                console.log(`🔍 [DEBUG] Sample cars in DB:`, existingCars.map(c => ({
                  stockId: c.stockId,
                  stockIdType: typeof c.stockId,
                  registration: c.registrationNumber,
                  make: c.make,
                  status: c.advertStatus
                })));
                
                console.log(`🔍 [DEBUG] Looking for stockId: "${mappedVehicle.stock_id}" (type: ${typeof mappedVehicle.stock_id})`);
                console.log(`🔍 [DEBUG] Looking for registration: "${mappedVehicle.registration}"`);
              }
              
              const soldCar = await Car.findOneAndUpdate(
                { dealerId, $or: orQuery, advertStatus: { $ne: 'sold' } },
                { $set: { advertStatus: 'sold', soldAt: new Date() } },
                { new: true }
              );
              
              console.log(`🔍 [SOLD] findOneAndUpdate result:`, soldCar ? `FOUND - ${soldCar._id}` : 'NOT FOUND');
              
              if (soldCar) {
                await FeedVehicle.findOneAndUpdate(
                  { dealerId, feedId: dealerFeed._id, stockId: mappedVehicle.stock_id },
                  { $set: { status: 'sold' } }
                );
                stats.vehicles_updated++;
                console.log(`✅ [SOLD] Marked sold: ${mappedVehicle.make} ${mappedVehicle.model} (stockId: ${mappedVehicle.stock_id})`);
              } else {
                console.log(`⚠️  [SOLD] Car not in DB or already sold: stockId=${mappedVehicle.stock_id}`);
                stats.vehicles_skipped++;
              }
            } catch (soldError) {
              console.error(`❌ [SOLD] Error:`, soldError.message);
              stats.errors.push({ stockId: mappedVehicle.stock_id, error: soldError.message });
            }
            
            continue;
          }
          // ═══════════════════════════════════════════════════════════════════
          
          // ═══════════════════════════════════════════════════════════════════
          // 🚨 STRICT LIMIT CHECK: Real-time enforcement before each vehicle
          // ═══════════════════════════════════════════════════════════════════
          if (subscription.listingsLimit) {
            const currentUsage = await this.getCurrentListingUsage(dealerId);
            
            if (currentUsage >= subscription.listingsLimit) {
              console.log(`🚫 [Feed Import] HARD STOP - Subscription limit ${subscription.listingsLimit} reached`);
              console.log(`📊 [Feed Import] Current count: ${currentUsage} cars (active + sold + draft)`);
              console.log(`⏭️  [Feed Import] Remaining ${mappedVehicles.indexOf(mappedVehicle) - mappedVehicles.length} cars will NOT be added to database`);
              
              stats.errors.push({
                stockId: mappedVehicle.stock_id,
                error: `Subscription limit ${subscription.listingsLimit} reached. Current usage: ${currentUsage} cars.`
              });
              break; // STOP PROCESSING - hard limit reached
            }
          }

          const result = await this.processVehicleEnhanced(dealerId, dealerFeed._id, mappedVehicle, options);

          if (result.action === 'imported') stats.vehicles_imported++;
          else if (result.action === 'updated') stats.vehicles_updated++;
          else if (result.action === 'skipped') {
            stats.vehicles_skipped++;
            console.log(`⏭️  [Feed Import] Skipped: ${mappedVehicle.make} ${mappedVehicle.model} (${mappedVehicle.stock_id})`);
          }

          if (result.images) stats.images_imported += result.images;
          if (result.unsplashImages) stats.unsplash_images_used += result.unsplashImages;

        } catch (error) {
          console.error(`❌ [Feed Import] Error processing ${mappedVehicle.stock_id}:`, error.message);
          console.error(`   Stack trace:`, error.stack);
          stats.errors.push({ stockId: mappedVehicle.stock_id, error: error.message });
        }
      }

      if (options.removeSoldVehicles !== false) {
        const currentStockIds = mappedVehicles.map(v => v.stock_id);
        stats.vehicles_archived = await this.archiveMissingVehicles(dealerId, dealerFeed._id, currentStockIds);
      }

      await DealerFeed.findByIdAndUpdate(dealerFeed._id, { lastSync: new Date(), provider, status: 'active' });

      const duration = Date.now() - startTime;
      await FeedLog.create({
        dealerId,
        feedId: dealerFeed._id,
        status: stats.errors.length === 0 ? 'success' : 'partial',
        vehiclesFound: stats.vehicles_found,
        vehiclesImported: stats.vehicles_imported,
        vehiclesUpdated: stats.vehicles_updated,
        vehiclesArchived: stats.vehicles_archived,
        imagesImported: stats.images_imported,
        feedErrors: stats.errors,
        durationMs: duration,
        metadata: {
          limitApplied: stats.limit_applied,
          unsplashImagesUsed: stats.unsplash_images_used,
          selectionMode: options.selectionMode
        }
      });

      return {
        success: true,
        stats,
        duration,
        provider,
        format,
        limitApplied: stats.limit_applied,
        unsplashImagesUsed: stats.unsplash_images_used
      };

    } catch (error) {
      await FeedLog.create({
        dealerId,
        feedId: null,
        status: 'failed',
        vehiclesFound: stats.vehicles_found,
        errors: [{ error: error.message }],
        durationMs: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Apply vehicle selection based on subscription limits
   */
  applyVehicleSelection(vehicles, limit, selectionMode = 'first') {
    switch (selectionMode) {
      case 'highest-price':
        return [...vehicles].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, limit);
      case 'newest':
        return [...vehicles].sort((a, b) => new Date(b.date_added || 0) - new Date(a.date_added || 0)).slice(0, limit);
      case 'lowest-mileage':
        return [...vehicles].sort((a, b) => (a.mileage || 999999) - (b.mileage || 999999)).slice(0, limit);
      case 'first':
      default:
        return vehicles.slice(0, limit);
    }
  }

  /**
   * Enhanced vehicle processing — uses feedImageService for all image handling
   */
  async processVehicleEnhanced(dealerId, feedId, mappedVehicle, options = {}) {
    try {
      console.log('\n' + '═'.repeat(80));
      console.log('🔍 [processVehicleEnhanced] Processing vehicle...');
      console.log('═'.repeat(80));
      console.log('📋 Input Data:');
      console.log('   stockId:', mappedVehicle.stock_id);
      console.log('   make:', mappedVehicle.make);
      console.log('   model:', mappedVehicle.model);
      console.log('   registration:', mappedVehicle.registration);
      console.log('   imageCount:', mappedVehicle.images?.length || 0);
      console.log('═'.repeat(80) + '\n');

      // ── Step 1: Save/update FeedVehicle record ─────────────────────────────
      const feedVehicleData = {
        dealerId,
        feedId,
        stockId: mappedVehicle.stock_id, // ✅ This is the critical field
        vehicleData: mappedVehicle,
        hasVehicleData: true,
        vehicleDataKeys: Object.keys(mappedVehicle),
        // Normalize images from feed into FeedVehicle format
        images: this.normalizeImagesForFeedVehicle(mappedVehicle.images),
        lastUpdated: new Date()
      };
      
      // ═══════════════════════════════════════════════════════════════════════
      // 🔍 DIAGNOSTIC: Validate stockId before creating FeedVehicle
      // ═══════════════════════════════════════════════════════════════════════
      if (!feedVehicleData.stockId || feedVehicleData.stockId === 'null' || feedVehicleData.stockId === 'undefined') {
        const errorMsg = `FATAL: Attempting to create FeedVehicle with invalid stockId! stockId=${feedVehicleData.stockId}`;
        console.error('❌ ' + errorMsg);
        console.error('   mappedVehicle.stock_id =', mappedVehicle.stock_id);
        console.error('   mappedVehicle keys:', Object.keys(mappedVehicle));
        throw new Error(errorMsg);
      }
      
      console.log('✅ [processVehicleEnhanced] Valid stockId confirmed before FeedVehicle creation:', feedVehicleData.stockId);

      // ═══════════════════════════════════════════════════════════════════════
      // 🔧 FIX: Use upsert with retry logic to avoid race condition
      // This prevents "concurrent modification" errors when same car is processed multiple times
      // ═══════════════════════════════════════════════════════════════════════
      const maxRetries = 3;
      let retryCount = 0;
      let feedVehicle = null;
      
      while (retryCount < maxRetries && !feedVehicle) {
        try {
          // Use findOneAndUpdate with upsert to atomically create/update
          feedVehicle = await FeedVehicle.findOneAndUpdate(
            { 
              dealerId, 
              feedId, 
              stockId: mappedVehicle.stock_id 
            },
            {
              $set: feedVehicleData,
              $setOnInsert: { createdAt: new Date() }
            },
            { 
              upsert: true,  // Create if doesn't exist
              new: true,     // Return updated document
              runValidators: true
            }
          );
          
          if (feedVehicle) {
            console.log(`✅ [processVehicleEnhanced] Upserted FeedVehicle: ${feedVehicle._id}`);
            break; // Success - exit loop
          }
        } catch (upsertError) {
          retryCount++;
          
          if (upsertError.code === 11000) {
            // Duplicate key - wait and retry
            console.log(`⚠️  [processVehicleEnhanced] Retry ${retryCount}/${maxRetries} - duplicate detected for stockId: ${mappedVehicle.stock_id}`);
            console.log(`   Duplicate key error:`, upsertError.message);
            
            // On final retry, try to find existing FeedVehicle
            if (retryCount >= maxRetries) {
              console.log(`⚠️  [processVehicleEnhanced] Max retries reached, attempting to find existing FeedVehicle...`);
              feedVehicle = await FeedVehicle.findOne({ 
                dealerId, 
                feedId, 
                stockId: mappedVehicle.stock_id 
              });
              if (feedVehicle) {
                console.log(`✅ [processVehicleEnhanced] Found existing FeedVehicle: ${feedVehicle._id}`);
                break; // Exit retry loop with existing FeedVehicle
              }
            } else {
              await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Exponential backoff
            }
          } else {
            // Other error - throw immediately
            console.error(`❌ [processVehicleEnhanced] Non-duplicate error:`, upsertError.message);
            throw upsertError;
          }
        }
      }
      
      if (!feedVehicle) {
        // WORKAROUND: Skip this vehicle instead of failing entire import
        console.error(`⚠️  [processVehicleEnhanced] Skipping vehicle after ${maxRetries} retries: ${mappedVehicle.stock_id}`);
        return { 
          action: 'skipped', 
          reason: 'Failed to create FeedVehicle - possible duplicate or race condition',
          car: null 
        };
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // 🔍 FINAL VALIDATION: Double-check FeedVehicle has valid stockId
      // ═══════════════════════════════════════════════════════════════════════
      console.log('🔍 [processVehicleEnhanced] Final FeedVehicle validation:');
      console.log('   FeedVehicle._id:', feedVehicle._id);
      console.log('   FeedVehicle.stockId:', feedVehicle.stockId);
      console.log('   FeedVehicle.vehicleData exists:', !!feedVehicle.vehicleData);
      console.log('   FeedVehicle.vehicleData.stock_id:', feedVehicle.vehicleData?.stock_id);
      
      if (!feedVehicle.stockId) {
        const errorMsg = `FATAL: FeedVehicle ${feedVehicle._id} was saved but has no stockId!`;
        console.error('❌ ' + errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ [processVehicleEnhanced] FeedVehicle validation passed!\n');

      // ── Step 2: Create/update Car listing ─────────────────────────────────
      let carResult;
      try {
        console.log(`🚗 [processVehicleEnhanced] Creating car from FeedVehicle:`, {
          feedVehicleId: feedVehicle._id,
          stockId: feedVehicle.stockId,
          make: feedVehicle.vehicleData?.make,
          model: feedVehicle.vehicleData?.model
        });
        
        carResult = await this.createOrUpdateCarListing(feedVehicle, options);
        console.log(`✅ [processVehicleEnhanced] Car ${carResult.action}: ${carResult.car?._id}`);
      } catch (carError) {
        console.error(`❌ [processVehicleEnhanced] Car creation error for stock ${feedVehicle.stockId}:`, carError.message);
        console.error(`   Error code:`, carError.code);
        console.error(`   Full error:`, carError);
        throw new Error(`Failed to create car listing for stock ${feedVehicle.stockId}: ${carError.message}`);
      }

      // ── Step 3: Save image records to DB and process in background ─────────
      let imagesCount = 0;
      let unsplashUsed = false;

      const imageList = mappedVehicle.images || [];

      if (imageList.length > 0) {
        // Save FeedImage records (pending download)
        try {
          imagesCount = await this.importImages(feedVehicle._id, imageList);
          console.log(`🖼️  [processVehicleEnhanced] Saved ${imagesCount} image records`);
        } catch (imageError) {
          console.warn(`⚠️  [processVehicleEnhanced] Image save warning: ${imageError.message}`);
          // Don't fail the whole vehicle import if images fail
        }

        // Kick off background download → Cloudinary → Car.images update
        if (carResult.car && imagesCount > 0) {
          console.log(`🖼️  [processVehicleEnhanced] Background image processing for car ${carResult.car._id}`);
          this.processImagesAsync(feedVehicle._id, carResult.car._id).catch(err => {
            console.error(`Background image processing failed for ${feedVehicle._id}:`, err.message);
          });
        }

      } else if (options.useUnsplashFallback) {
        // ⚠️ DEPRECATED: source.unsplash.com/SIZE/?query no longer works
        // Don't use fallback - better to have no images than broken images
        console.log(`⚠️  [processVehicleEnhanced] No images in feed - skipping Unsplash fallback (deprecated)`);
      }

      return {
        action: carResult.action,
        images: imagesCount,
        unsplashImages: unsplashUsed ? imagesCount : 0,
        feedVehicle,
        carListing: carResult.car
      };

    } catch (error) {
      // 🚨 CATCH ANY ERROR and log it clearly
      console.error(`\n❌ [processVehicleEnhanced] FATAL ERROR processing vehicle ${mappedVehicle.stock_id || 'UNKNOWN'}:`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error name: ${error.name}`);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Stack trace:`, error.stack);
      console.error();
      throw error; // Re-throw with original error for proper error handling
    }
  }

  /**
   * Check subscription limits
   * Returns current usage based on ALL statuses (active, sold, draft)
   * @param {string} dealerId - Dealer ID
   * @returns {Promise<Object>} Subscription limits info
   */
  async checkSubscriptionLimits(dealerId) {
    try {
      // Load models properly
      const TradeSubscription = require('../models/TradeSubscription');
      const SubscriptionPlan = require('../models/SubscriptionPlan');
      
      const subscription = await TradeSubscription.findOne({ dealerId, status: 'active' }).populate('planId');
      
      // Get REAL current usage from database (not subscription.listingsUsed)
      const actualUsage = await this.getCurrentListingUsage(dealerId);
      
      return {
        listingsLimit: subscription?.planId?.listingsLimit || null,
        listingsUsed: actualUsage, // Use actual count, not cached value
        hasLimit: !!subscription?.planId?.listingsLimit,
        planName: subscription?.planId?.name || 'No Plan'
      };
    } catch (error) {
      console.error('❌ [checkSubscriptionLimits] Error:', error.message);
      // Return unlimited if check fails (don't block import)
      return { listingsLimit: null, listingsUsed: 0, hasLimit: false, planName: 'Unknown' };
    }
  }

  /**
   * Get current listing usage count
   * ⚠️ COUNTS ALL STATUSES: active, sold, draft (not archived/deleted)
   * @param {string} dealerId - Dealer ID
   * @returns {Promise<number>} Total listings count
   */
  async getCurrentListingUsage(dealerId) {
    try {
      // Count ALL cars regardless of status (except archived/deleted)
      const count = await Car.countDocuments({ 
        dealerId,
        advertStatus: { $in: ['active', 'sold', 'draft'] } // All statuses count towards limit
      });
      
      console.log(`📊 [getCurrentListingUsage] Dealer ${dealerId}: ${count} cars (active + sold + draft)`);
      return count;
    } catch (error) {
      console.error('❌ [getCurrentListingUsage] Error:', error.message);
      return 0;
    }
  }

  /**
   * Process single vehicle (create or update) — used by importFeed (basic)
   */
  async processVehicle(dealerId, feedId, mappedVehicle, options = {}) {
    const searchCriteria = {
      dealerId,
      $or: [{ stockId: mappedVehicle.stock_id }]
    };
    if (mappedVehicle.vin) searchCriteria.$or.push({ vin: mappedVehicle.vin });
    if (mappedVehicle.registration) searchCriteria.$or.push({ registration: mappedVehicle.registration });

    let feedVehicle = await FeedVehicle.findOne(searchCriteria);

    const now = new Date();
    let action = 'updated';
    let imagesCount = 0;

    const vehicleData = {
      dealerId,
      feedId,
      stockId: mappedVehicle.stock_id,
      registration: mappedVehicle.registration,
      vin: mappedVehicle.vin,
      make: mappedVehicle.make,
      model: mappedVehicle.model,
      derivative: mappedVehicle.derivative,
      year: mappedVehicle.year,
      mileage: mappedVehicle.mileage,
      fuelType: mappedVehicle.fuel_type,
      transmission: mappedVehicle.transmission,
      colour: mappedVehicle.colour,
      price: mappedVehicle.price,
      description: mappedVehicle.description,
      rawData: mappedVehicle.raw_data,
      lastSeenInFeed: now,
      status: 'active'
    };

    if (!feedVehicle) {
      feedVehicle = await FeedVehicle.create(vehicleData);
      action = 'imported';
    } else {
      await FeedVehicle.findByIdAndUpdate(feedVehicle._id, vehicleData);
    }

    let car = null;
    if (options.createCarListings !== false) {
      car = await this.syncCarListing(dealerId, feedVehicle, mappedVehicle);
      if (car) {
        await FeedVehicle.findByIdAndUpdate(feedVehicle._id, { carId: car._id });
      } else {
        throw new Error('Failed to create/update car listing');
      }
    }

    const shouldImportImages = options.importImages !== false;
    if (shouldImportImages && Array.isArray(mappedVehicle.images) && mappedVehicle.images.length > 0) {
      try {
        imagesCount = await this.importImages(feedVehicle._id, mappedVehicle.images);
        if (car && imagesCount > 0) {
          this.processImagesAsync(feedVehicle._id, car._id).catch(err => {
            console.error(`Background image processing failed for ${feedVehicle._id}:`, err.message);
          });
        }
      } catch (error) {
        console.error(`Failed to import images for ${mappedVehicle.stock_id}:`, error.message);
      }
    }

    return { action, images: imagesCount };
  }

  /**
   * Background image processor — downloads and uploads to Cloudinary
   */
  async processImagesAsync(feedVehicleId, carId) {
    try {
      await feedImageService.processVehicleImages(feedVehicleId, carId);
    } catch (error) {
      console.error('Async image processing error:', error);
    }
  }

  /**
   * Sync car listing from feed vehicle (used by basic importFeed)
   */
  async syncCarListing(dealerId, feedVehicle, mappedVehicle) {
    try {
      let car = null;

      // Step 1: Try to find by carId (already linked to FeedVehicle)
      if (feedVehicle.carId) car = await Car.findById(feedVehicle.carId);
      
      // Step 2: Try to find by stockId (most reliable identifier for dealer inventory)
      if (!car && feedVehicle.stockId) {
        car = await Car.findOne({ stockId: feedVehicle.stockId, dealerId });
      }
      
      // Step 3: Fallback to registration number
      if (!car && mappedVehicle.registration) {
        car = await Car.findOne({ registrationNumber: mappedVehicle.registration, dealerId });
      }

      let dealerPostcode = 'SW1A 1AA';
      try {
        const TradeDealer = require('../models/TradeDealer');
        const dealer = await TradeDealer.findById(dealerId).select('businessAddress');
        if (dealer?.businessAddress?.postcode) dealerPostcode = dealer.businessAddress.postcode;
      } catch (err) {}

      const normalizedTransmission = this.normalizeTransmission(mappedVehicle.transmission);
      const normalizedFuelType = this.normalizeFuelType(mappedVehicle.fuel_type);
      const normalizedAdvertStatus = this.normalizeAdvertStatus(mappedVehicle.status);

      const carData = {
        dealerId,
        isDealerListing: true,
        // 🔑 CRITICAL FIX: Only set stockId if it has a valid value
        ...(feedVehicle.stockId ? { stockId: String(feedVehicle.stockId).trim() } : {}),
        registrationNumber: mappedVehicle.registration,
        make: mappedVehicle.make,
        model: mappedVehicle.model,
        variant: mappedVehicle.derivative,
        year: mappedVehicle.year || new Date().getFullYear(),
        mileage: mappedVehicle.mileage || 0,
        fuelType: normalizedFuelType || 'Petrol',
        transmission: normalizedTransmission || 'manual',
        color: mappedVehicle.colour || 'Not Specified',
        price: mappedVehicle.price,
        description: mappedVehicle.description || `${mappedVehicle.make} ${mappedVehicle.model}`,
        postcode: dealerPostcode,
        advertStatus: normalizedAdvertStatus, // Use normalized status from feed
        dataSource: 'manual',
        condition: 'used',
        skipNormalization: true
      };

      const skipAPIFetchFlag = { skipAPIFetch: true };

      if (car) {
        car.$locals = skipAPIFetchFlag;
        await Car.findByIdAndUpdate(car._id, carData);
      } else {
        car = new Car(carData);
        car.$locals = skipAPIFetchFlag;
        await car.save();
      }

      return car;
    } catch (error) {
      console.error('Error syncing car listing:', error);
      return null;
    }
  }

  /**
   * Save image URLs as FeedImage records (pending download)
   */
  async importImages(feedVehicleId, images) {
    let count = 0;
    try {
      await FeedImage.deleteMany({ feedVehicleId });

      for (const image of images) {
        try {
          const url = typeof image === 'string' ? image : image?.url;
          if (!url) continue;

          await FeedImage.create({
            feedVehicleId,
            sourceUrl: url,
            imageOrder: image.order !== undefined ? image.order : count,
            downloadStatus: 'pending'
          });
          count++;
        } catch (error) {
          console.error(`Error creating image record:`, error.message);
        }
      }

      return count;
    } catch (error) {
      console.error('importImages fatal error:', error);
      throw error;
    }
  }

  /**
   * Archive vehicles no longer in feed
   */
  async archiveMissingVehicles(dealerId, feedId, currentStockIds) {
    const missingVehicles = await FeedVehicle.find({
      dealerId,
      feedId,
      stockId: { $nin: currentStockIds },
      status: 'active'
    });

    let count = 0;
    for (const vehicle of missingVehicles) {
      await FeedVehicle.findByIdAndUpdate(vehicle._id, { status: 'sold' });
      if (vehicle.carId) {
        await Car.findByIdAndUpdate(vehicle.carId, { advertStatus: 'sold' });
      }
      count++;
    }

    return count;
  }

  /**
   * Enrich vehicle data by calling APIs for missing information
   * ⚠️ COST CONTROL: Only calls APIs when necessary
   * ⚠️ TESTING MODE: API calls are DISABLED by default
   * @param {Object} mappedVehicle - Vehicle data from feed
   * @param {Object} options - Import options
   * @param {string} dealerId - Dealer ID for settings check
   * @returns {Promise<Object>} Enriched data from APIs
   */
  async enrichVehicleDataFromAPIs(mappedVehicle, options = {}, dealerId = null) {
    // ══════════════════════════════════════════════════════════════════════════
    // 🎯 SMART API ENRICHMENT - Only fetch what's missing!
    // ══════════════════════════════════════════════════════════════════════════
    
    // ── COST CONTROL: Skip if not enabled ─────────────────────────────────────
    if (options.enableAPIEnrichment !== true) {
      return null;
    }
    
    // ── Registration zaroori hai ──────────────────────────────────────────────
    if (!mappedVehicle.registration) {
      console.log(`⏭️  [API] No registration — skipping enrichment`);
      return null;
    }

    const registration = mappedVehicle.registration.toUpperCase();
    const enrichment = {};

    try {
      // ── Step 1: Cache check (30 din valid) ──────────────────────────────────
      // Agar pehle call ho chuki hai aur 30 din nahi guzre, dobara call nahi hogi
      const cachedData = await this.checkCachedVehicleData(registration);
      
      console.log(`🔍 [API] Smart check for ${registration}:`, {
        hasSpecs: cachedData.hasSpecs,
        hasMOT: cachedData.hasMOT,
        hasHistory: cachedData.hasHistory,
        hasValuation: cachedData.hasValuation,
        cache: cachedData.summary
      });

      // ── Step 2: Decide kya kya missing hai ────────────────────────────────────
      // Specs: sirf tab call ho jab body type ya doors feed mein nahi hain
      const needsSpecs = (
        !mappedVehicle.body_type && 
        !mappedVehicle.bodyType && 
        !cachedData.hasSpecs
      );
      
      // MOT: sirf tab call ho jab MOT history feed mein nahi hai
      const needsMOT = (
        !mappedVehicle.mot_history && 
        !mappedVehicle.motHistory && 
        !cachedData.hasMOT
      );
      
      // History: sirf tab call ho jab cache nahi hai ya expire ho gaya (£1.82 — mehenga!)
      const needsHistory = !cachedData.hasHistory;
      
      // Valuation: ALWAYS call for market value comparison (£0.02 - cheap!)
      // Even if price exists in feed, we need market valuation for price indicator
      const needsValuation = (
        !cachedData.hasValuation &&
        !!mappedVehicle.mileage // mileage zaroori hai valuation ke liye
      );

      const totalCost = (needsSpecs ? 0.02 : 0) + 
                        (needsMOT ? 0.02 : 0) + 
                        (needsHistory ? 1.82 : 0) + 
                        (needsValuation ? 0.02 : 0);

      if (!needsSpecs && !needsMOT && !needsHistory && !needsValuation) {
        console.log(`✅ [API] ${registration}: Sab data already available — no API calls needed`);
        return null;
      }

      console.log(`📞 [API] ${registration} ke liye calls:`, {
        specs: needsSpecs ? '£0.02' : '✓ skip',
        mot: needsMOT ? '£0.02' : '✓ skip',
        history: needsHistory ? '£1.82' : '✓ skip (cached)',
        valuation: needsValuation ? '£0.02' : '✓ skip',
        totalCost: `£${totalCost.toFixed(2)}`
      });

      // ── Step 3: Parallel API calls — sirf jo zaroori hain ────────────────────
      const apiCalls = [];

      if (needsSpecs) {
        const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
        const specsClient = new CheckCarDetailsClient();
        apiCalls.push(
          specsClient.getVehicleData(registration)
            .then(data => ({ type: 'specs', data }))
            .catch(err => {
              console.warn(`⚠️  [API] Specs failed for ${registration}:`, err.message);
              return { type: 'specs', data: null };
            })
        );
      }

      if (needsMOT) {
        const MOTHistoryService = require('./motHistoryService');
        const motService = new MOTHistoryService();
        apiCalls.push(
          motService.getMOTHistory(registration)
            .then(data => ({ type: 'mot', data }))
            .catch(err => {
              console.warn(`⚠️  [API] MOT failed for ${registration}:`, err.message);
              return { type: 'mot', data: null };
            })
        );
      }

      if (needsHistory) {
        const HistoryService = require('./historyService');
        const historyService = new HistoryService();
        apiCalls.push(
          // false = use cache if available (30 days) — expensive call!
          historyService.checkVehicleHistory(registration, false)
            .then(data => ({ type: 'history', data }))
            .catch(err => {
              console.warn(`⚠️  [API] History failed for ${registration}:`, err.message);
              return { type: 'history', data: null };
            })
        );
      }

      if (needsValuation) {
        const ValuationAPIClient = require('../clients/ValuationAPIClient');
        const { loadAPICredentials, getActiveAPIKey, getActiveBaseUrl } = require('../config/apiCredentials');
        const credentials = loadAPICredentials();
        const environment = credentials.environment || 'production';
        const apiKey = getActiveAPIKey(credentials.valuationAPI, environment);
        const baseUrl = getActiveBaseUrl(credentials.valuationAPI, environment);
        const valuationClient = new ValuationAPIClient(apiKey, baseUrl, environment === 'test');
        
        apiCalls.push(
          valuationClient.getValuation(registration, mappedVehicle.mileage)
            .then(data => ({ type: 'valuation', data }))
            .catch(err => {
              console.warn(`⚠️  [API] Valuation failed for ${registration}:`, err.message);
              return { type: 'valuation', data: null };
            })
        );
      }

      // ── Step 4: Sab calls parallel chalao ─────────────────────────────────────
      const results = await Promise.all(apiCalls);

      for (const result of results) {
        if (!result.data) continue;
        
        if (result.type === 'specs') {
          enrichment.specs = result.data;
          console.log(`✅ [API] Specs fetched for ${registration}`);
        } else if (result.type === 'mot') {
          enrichment.motHistory = result.data.motTests || result.data.motHistory || [];
          enrichment.motStatus  = result.data.motStatus;
          enrichment.motDue     = result.data.motExpiryDate || result.data.motDueDate;
          enrichment.motExpiry  = result.data.motExpiryDate;
          console.log(`✅ [API] MOT fetched for ${registration}: ${enrichment.motHistory.length} tests`);
        } else if (result.type === 'history') {
          enrichment.history = result.data;
          console.log(`✅ [API] History fetched for ${registration}`);
        } else if (result.type === 'valuation') {
          enrichment.valuation = result.data;
          console.log(`✅ [API] Valuation fetched for ${registration}: £${result.data.estimatedValue || result.data.privatePrice}`);
        }
      }

      return Object.keys(enrichment).length > 0 ? enrichment : null;

    } catch (error) {
      console.error(`❌ [API] Error enriching ${registration}:`, error.message);
      return Object.keys(enrichment).length > 0 ? enrichment : null;
    }
  }

  /**
   * Calculate estimated API call cost
   * @param {Object} needs - What APIs need to be called
   * @returns {number} Cost in GBP
   */
  calculateAPICost(needs) {
    let cost = 0;
    if (needs.needsSpecs) cost += 0.02;
    if (needs.needsMOT) cost += 0.02;
    if (needs.needsHistory) cost += 1.82; // Most expensive
    if (needs.needsValuation) cost += 0.02;
    return cost;
  }

  /**
   * Check cached vehicle data to avoid unnecessary API calls
   * @param {string} registration - Vehicle registration
   * @returns {Promise<Object>} Cache status
   */
  async checkCachedVehicleData(registration) {
    try {
      const VehicleHistory = require('../models/VehicleHistory');
      
      const cached = await VehicleHistory.findOne({ 
        vrm: registration.toUpperCase() 
      }).sort({ checkDate: -1 });

      if (!cached) {
        return {
          hasSpecs: false,
          hasMOT: false,
          hasHistory: false,
          hasValuation: false,
          summary: 'No cache'
        };
      }

      // Check if cache is still valid (30 days)
      const daysSinceCheck = (Date.now() - cached.checkDate.getTime()) / (1000 * 60 * 60 * 24);
      const isValid = daysSinceCheck <= 30;

      return {
        hasSpecs: isValid && (!!cached.bodyType || !!cached.doors),
        hasMOT: isValid && cached.motHistory && cached.motHistory.length > 0,
        hasHistory: isValid,
        hasValuation: isValid && !!cached.valuation,
        summary: isValid ? `Cached (${Math.floor(daysSinceCheck)} days old)` : 'Cache expired'
      };

    } catch (error) {
      console.error('Error checking cache:', error.message);
      return {
        hasSpecs: false,
        hasMOT: false,
        hasHistory: false,
        hasValuation: false,
        summary: 'Cache check failed'
      };
    }
  }

  /**
   * Get dealer API enrichment settings
   * @param {string} dealerId - Dealer ID
   * @returns {Promise<Object>} Settings
   */
  async getDealerEnrichmentSettings(dealerId) {
    try {
      const TradeDealer = require('../models/TradeDealer');
      const dealer = await TradeDealer.findById(dealerId).select('settings');
      
      return {
        enabled: dealer?.settings?.enableAPIEnrichment || false, // Default: DISABLED
        maxCostPerCar: dealer?.settings?.maxAPIEnrichmentCost || 2.00 // Max £2 per car
      };
    } catch (error) {
      console.error('Error fetching dealer settings:', error.message);
      return { enabled: false, maxCostPerCar: 2.00 };
    }
  }

  /**
   * Create or update Car listing from FeedVehicle
   */
  async createOrUpdateCarListing(feedVehicle, options = {}) {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // 🔍 DIAGNOSTIC: Check feedVehicle data integrity
      // ═══════════════════════════════════════════════════════════════════════
      console.log('\n🚗 [createOrUpdateCarListing] Starting car creation/update...');
      console.log('   FeedVehicle ID:', feedVehicle._id);
      console.log('   FeedVehicle.stockId:', feedVehicle.stockId);
      console.log('   FeedVehicle.vehicleData exists:', !!feedVehicle.vehicleData);
      console.log('   FeedVehicle.vehicleData.stock_id:', feedVehicle.vehicleData?.stock_id);
      console.log('   FeedVehicle.carId:', feedVehicle.carId);
      
      const mappedVehicle = feedVehicle.vehicleData || {};
      
      // ═══════════════════════════════════════════════════════════════════════
      // 🚨 CRITICAL VALIDATION: Ensure stockId is set
      // ═══════════════════════════════════════════════════════════════════════
      if (!feedVehicle.stockId || feedVehicle.stockId === 'null' || feedVehicle.stockId === 'undefined') {
        const errorMsg = `FATAL: FeedVehicle ${feedVehicle._id} has no valid stockId!`;
        console.error('❌ ' + errorMsg);
        console.error('   feedVehicle.stockId =', feedVehicle.stockId);
        console.error('   mappedVehicle.stock_id =', mappedVehicle.stock_id);
        throw new Error(errorMsg);
      }
      
      console.log('✅ [createOrUpdateCarListing] Valid stockId confirmed:', feedVehicle.stockId);

      // ═══════════════════════════════════════════════════════════════════════
      // 🚨 CRITICAL: Use REGISTRATION as primary identifier, not stockId
      // Registration is ALWAYS present in feed, stockId might be missing
      // ═══════════════════════════════════════════════════════════════════════
      
      let car = null;
      
      // Step 1: Try to find by carId (already linked to FeedVehicle)
      if (feedVehicle.carId) {
        car = await Car.findById(feedVehicle.carId);
      }
      
      // Step 2: MOST IMPORTANT - Find by registration number + dealerId
      // This is the REAL unique identifier for vehicles
      if (!car && mappedVehicle.registration) {
        car = await Car.findOne({ 
          registrationNumber: mappedVehicle.registration, 
          dealerId: feedVehicle.dealerId 
        });
      }
      
      // Step 3: Only use stockId if it exists AND registration not found
      if (!car && feedVehicle.stockId) {
        car = await Car.findOne({ 
          stockId: feedVehicle.stockId, 
          dealerId: feedVehicle.dealerId 
        });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 🛡️ SMART PROTECTION: Don't overwrite dealer's manual edits
      // ═══════════════════════════════════════════════════════════════════════
      // Strategy:
      // - If car has stockId → it's from feed → ALLOW updates (auto-sync safe)
      // - If car was manually created (userId exists) → PROTECT from overwrite
      // - If car was created from DVLA lookup → PROTECT from overwrite
      // 
      // This ensures:
      // ✅ Feed-generated cars update automatically (what dealer expects)
      // ✅ Manually created cars are protected from overwrite
      
      const allowOverwrite = options.allowOverwriteActive === true; // Explicit override
      
      if (car && car.advertStatus === 'active' && !allowOverwrite) {
        // Check if this car was created from feed (has stockId from same dealer)
        const isFromFeed = car.stockId && car.isDealerListing;
        
        if (isFromFeed) {
          // This car is from feed → SAFE to update (expected behavior)
          console.log(`🔄 [createOrUpdateCarListing] Updating feed car: ${mappedVehicle.make} ${mappedVehicle.model} (Stock: ${car.stockId})`);
        } else {
          // This car was manually created → PROTECT from overwrite
          const wasManuallyCreated = car.dataSource === 'DVLA' || car.userId;
          
          if (wasManuallyCreated) {
            console.log(`🚫 [createOrUpdateCarListing] Skipping manually created car: ${car.make} ${car.model} (${car.registrationNumber})`);
            return { action: 'skipped', car, reason: 'Manually created - protected from feed overwrite' };
          }
        }
      }

      // ── API Enrichment: Fetch missing data ──────────────────────────────────
      // ⚠️ COST CONTROL: Only enabled if dealer opts in
      // 🆕 SMART SYNC: Only enrich NEW cars (not existing ones during sync)
      let apiEnrichment = null;
      
      const isNewCar = !car; // New car if no existing car found
      const shouldEnrich = options.onlyEnrichNewCars ? isNewCar : true;
      
      if (shouldEnrich) {
        apiEnrichment = await this.enrichVehicleDataFromAPIs(
          mappedVehicle, 
          options,
          feedVehicle.dealerId // Pass dealer ID for settings check
        );
        
        if (apiEnrichment) {
          console.log(`🔄 [createOrUpdateCarListing] Enriched ${isNewCar ? 'NEW' : 'existing'} car from APIs for ${mappedVehicle.registration}:`, {
            hasValuation: !!apiEnrichment.valuation,
            hasMOTHistory: !!apiEnrichment.motHistory,
            hasSpecs: !!apiEnrichment.specs
          });
        }
      } else {
        console.log(`⏭️  [createOrUpdateCarListing] Skipping API enrichment for existing car: ${mappedVehicle.registration}`);
      }

      let dealerPostcode = 'SW1A 1AA';
      try {
        const TradeDealer = require('../models/TradeDealer');
        const dealer = await TradeDealer.findById(feedVehicle.dealerId).select('businessAddress');
        if (dealer?.businessAddress?.postcode) dealerPostcode = dealer.businessAddress.postcode;
      } catch (err) {}

      // Get image URLs — prefer already-processed Cloudinary URLs
      let imageUrls = [];
      
      // Priority 1: Check if FeedVehicle has processed Cloudinary URLs
      if (feedVehicle.images?.length > 0) {
        imageUrls = feedVehicle.images
          .map(img => img.processedUrl || img.sourceUrl || img.url)
          .filter(Boolean);
      }
      
      // Priority 2: If no images yet, extract from mappedVehicle (raw feed data)
      if (imageUrls.length === 0 && mappedVehicle.images?.length > 0) {
        imageUrls = mappedVehicle.images
          .map(img => {
            if (typeof img === 'string') return img;
            if (img?.url) return img.url;
            return null;
          })
          .filter(Boolean);
      }
      
      console.log(`📸 [createOrUpdateCarListing] Found ${imageUrls.length} images for ${mappedVehicle.make} ${mappedVehicle.model}`);
      if (imageUrls.length > 0) {
        console.log('   Image sources:');
        imageUrls.slice(0, 3).forEach((img, i) => {
          console.log(`   ${i + 1}. ${img.substring(0, 100)}`);
        });
      } else {
        console.log('   ⚠️  NO IMAGES FOUND - checking source data...');
        console.log('   feedVehicle.images:', feedVehicle.images?.length || 0);
        console.log('   mappedVehicle.images:', mappedVehicle.images?.length || 0);
        if (mappedVehicle.images && mappedVehicle.images.length > 0) {
          console.log('   Sample mappedVehicle image:', JSON.stringify(mappedVehicle.images[0]));
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 🔑 StockId handling: Only set if valid, otherwise leave undefined
      // ═══════════════════════════════════════════════════════════════════════
      const validatedStockId = (feedVehicle.stockId && 
                                feedVehicle.stockId !== 'null' && 
                                feedVehicle.stockId !== 'undefined' && 
                                String(feedVehicle.stockId).trim() !== '') 
                                ? String(feedVehicle.stockId).trim() 
                                : undefined;
      
      if (validatedStockId) {
        console.log('✅ [createOrUpdateCarListing] Using stockId:', validatedStockId);
      } else {
        console.log('⚠️  [createOrUpdateCarListing] No valid stockId - using registration as identifier');
      }
      
      // Merge feed data with API enrichment
      const carData = {
        dealerId: feedVehicle.dealerId,
        isDealerListing: true,
        registrationNumber: mappedVehicle.registration || `TBD${Date.now()}`,
        make: mappedVehicle.make || apiEnrichment?.specs?.make || 'Unknown',
        model: mappedVehicle.model || apiEnrichment?.specs?.model || 'Unknown',
        variant: mappedVehicle.derivative || apiEnrichment?.specs?.variant || null,
        year: mappedVehicle.year || apiEnrichment?.specs?.year || new Date().getFullYear(),
        mileage: mappedVehicle.mileage || 0,
        fuelType: this.normalizeFuelType(mappedVehicle.fuel_type) || apiEnrichment?.specs?.fuelType || 'Petrol',
        transmission: this.normalizeTransmission(mappedVehicle.transmission) || apiEnrichment?.specs?.transmission || 'manual',
        color: mappedVehicle.colour || mappedVehicle.color || apiEnrichment?.specs?.color || 'Not Specified',
        price: mappedVehicle.price || 0,
        description: mappedVehicle.description || `${mappedVehicle.make || 'Unknown'} ${mappedVehicle.model || 'Unknown'}`,
        postcode: dealerPostcode,
        advertStatus: this.normalizeAdvertStatus(mappedVehicle.status) || 'active', // ✅ Map feed status to advertStatus
        dataSource: 'manual',
        condition: 'used',
        skipNormalization: true,
        images: imageUrls,
        
        // 🔑 CRITICAL: Only add stockId if it's valid - prevents duplicate key errors
        ...(validatedStockId ? { stockId: validatedStockId } : {}),
        
        // Add enriched data from APIs (if available)
        ...(apiEnrichment?.specs?.bodyType && { bodyType: apiEnrichment.specs.bodyType }),
        ...(apiEnrichment?.specs?.doors && { doors: apiEnrichment.specs.doors }),
        ...(apiEnrichment?.specs?.seats && { seats: apiEnrichment.specs.seats }),
        ...(apiEnrichment?.specs?.engineSize && { engineSize: apiEnrichment.specs.engineSize }),
        
        // MOT History
        ...(apiEnrichment?.motHistory && {
          motHistory: apiEnrichment.motHistory,
          motStatus: apiEnrichment.motStatus,
          motDue: apiEnrichment.motDue,
          motExpiry: apiEnrichment.motExpiry
        }),
        
        // Vehicle History
        ...(apiEnrichment?.history && {
          historyCheckId: apiEnrichment.history._id?.toString(),
          historyCheckStatus: 'verified',
          historyCheckDate: apiEnrichment.history.checkDate,
          previousOwners: apiEnrichment.history.previousOwners || apiEnrichment.history.numberOfPreviousKeepers,
          colourChanges: apiEnrichment.history.colourChanges,
          plateChanges: apiEnrichment.history.plateChanges
        }),
        
        // Valuation
        ...(apiEnrichment?.valuation && {
          estimatedValue: apiEnrichment.valuation.estimatedValue || apiEnrichment.valuation.dealerPrice,
          valuationData: {
            privatePrice: apiEnrichment.valuation.privatePrice,
            dealerPrice: apiEnrichment.valuation.dealerPrice,
            partExchangePrice: apiEnrichment.valuation.partExchangePrice,
            confidence: apiEnrichment.valuation.confidence,
            valuationDate: new Date()
          }
        })
      };

      const skipAPIFetchFlag = { skipAPIFetch: true };
      let action = 'updated';

      // ═══════════════════════════════════════════════════════════════════════
      // 🔧 FIX: Simple and reliable create/update logic
      // ═══════════════════════════════════════════════════════════════════════
      if (car) {
        // Car exists - update it
        console.log(`🔄 [createOrUpdateCarListing] Updating existing car:`, {
          carId: car._id,
          oldMake: car.make,
          newMake: carData.make,
          oldModel: car.model,
          newModel: carData.model,
          oldStatus: car.advertStatus,
          newStatus: carData.advertStatus,
          oldPrice: car.price,
          newPrice: carData.price
        });
        
        car.$locals = skipAPIFetchFlag;
        Object.keys(carData).forEach(key => {
          car[key] = carData[key];
        });
        await car.save();
        console.log('✅ [createOrUpdateCarListing] Updated car:', car._id);
      } else {
        // Car doesn't exist - create new
        try {
          car = new Car(carData);
          car.$locals = skipAPIFetchFlag;
          await car.save();
          action = 'imported';
          console.log('✅ [createOrUpdateCarListing] Created car:', car._id);
        } catch (carCreateError) {
          // If creation fails with duplicate key, try to find and update
          if (carCreateError.code === 11000) {
            console.log(`⚠️  [createOrUpdateCarListing] Duplicate detected, fetching existing...`);
            
            // Try to find by stockId
            car = await Car.findOne({ stockId: feedVehicle.stockId, dealerId: feedVehicle.dealerId });
            
            if (car) {
              // Found it - update instead
              car.$locals = skipAPIFetchFlag;
              Object.keys(carData).forEach(key => {
                car[key] = carData[key];
              });
              await car.save();
              console.log('✅ [createOrUpdateCarListing] Updated existing car:', car._id);
            } else {
              // Still not found - rethrow error
              throw carCreateError;
            }
          } else {
            throw carCreateError;
          }
        }
      }

      if (car && !feedVehicle.carId) {
        await FeedVehicle.findByIdAndUpdate(feedVehicle._id, { carId: car._id });
      }

      return { action, car };

    } catch (error) {
      console.error('❌ [createOrUpdateCarListing] Error:', error);
      throw error;
    }
  }

  /**
   * Normalize images array for FeedVehicle schema
   */
  normalizeImagesForFeedVehicle(images) {
    if (!images || !Array.isArray(images)) return [];

    return images.map((img, index) => {
      if (typeof img === 'object' && img !== null && (img.url || img.sourceUrl)) {
        return {
          url: img.url || img.sourceUrl || '',
          sourceUrl: img.sourceUrl || img.url || '',
          processedUrl: img.processedUrl || null,
          order: img.order !== undefined ? img.order : index,
          downloadStatus: img.downloadStatus || 'pending'
        };
      }
      if (typeof img === 'string') {
        return { url: img, sourceUrl: img, processedUrl: null, order: index, downloadStatus: 'pending' };
      }
      return null;
    }).filter(img => img && img.url);
  }

  /**
   * Normalize transmission value to enum
   */
  normalizeTransmission(value) {
    if (!value) return 'manual';
    const t = value.toLowerCase();
    if (t.includes('auto')) return 'automatic';
    if (t.includes('semi')) return 'semi-automatic';
    return 'manual';
  }

  /**
   * Normalize fuel type value to enum
   */
  normalizeFuelType(value) {
    if (!value) return 'Petrol';
    const fuelMap = {
      'petrol': 'Petrol',
      'diesel': 'Diesel',
      'electric': 'Electric',
      'hybrid': 'Hybrid',
      'petrol hybrid': 'Petrol Hybrid',
      'diesel hybrid': 'Diesel Hybrid',
      'plug-in hybrid': 'Plug-in Hybrid',
      'phev': 'Plug-in Hybrid'
    };
    return fuelMap[value.toLowerCase()] || value;
  }

  /**
   * Normalize advert status from feed to match Car model enum
   * Maps various feed status values to: 'active', 'sold', 'draft', 'archived'
   */
  normalizeAdvertStatus(value) {
    if (!value) return 'active'; // Default to active if no status provided
    
    const status = String(value).toLowerCase().trim();
    
    // Map common status values
    if (status === 'active' || status === 'available' || status === 'in stock') {
      return 'active';
    }
    
    if (status === 'sold' || status === 'sold out' || status === 'unavailable') {
      return 'sold';
    }
    
    if (status === 'draft' || status === 'pending' || status === 'unpublished') {
      return 'draft';
    }
    
    if (status === 'archived' || status === 'deleted' || status === 'removed') {
      return 'archived';
    }
    
    // Default to active for unknown statuses
    console.log(`⚠️  Unknown status "${value}" - defaulting to "active"`);
    return 'active';
  }

  /**
   * Get feed logs for dealer
   */
  async getFeedLogs(dealerId, limit = 20) {
    return await FeedLog.find({ dealerId }).sort({ syncTime: -1 }).limit(limit);
  }

  /**
   * Get dealer feeds
   */
  async getDealerFeeds(dealerId) {
    return await DealerFeed.find({ dealerId }).sort({ createdAt: -1 });
  }
}

module.exports = new FeedImportService();