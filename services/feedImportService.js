const feedFetcher = require('./feedFetcher');
const feedProviderDetector = require('./feedProviderDetector');
const feedMapper = require('./feedMapper');
const feedImageService = require('./feedImageService');
const feedImageProcessor = require('./feedImageProcessor'); // New enhanced image processor
// const imageCleanupService = require('./imageCleanupService'); // Commented out for testing
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
      // Fetch and parse feed
      const testResult = await feedFetcher.testFeed(feedUrl);
      
      if (!testResult.success) {
        return {
          success: false,
          error: testResult.error
        };
      }

      // Detect provider
      const provider = feedProviderDetector.detect(testResult.preview, testResult.format);

      // Map vehicles to get count
      const mappedVehicles = feedMapper.mapVehicles(
        testResult.preview,
        testResult.format,
        provider
      );

      const hasImages = mappedVehicles.some(v => v.images && v.images.length > 0);

      return {
        success: true,
        format: testResult.format,
        provider,
        vehicleCount: mappedVehicles.length,
        hasImages,
        duration: testResult.duration,
        preview: mappedVehicles.slice(0, 3), // First 3 vehicles as preview
        message: `Feed found! ${mappedVehicles.length} vehicles detected.`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
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
      // 1. Fetch feed
      const fetchResult = await feedFetcher.fetchFeed(feedUrl);
      if (!fetchResult.success) {
        throw new Error(`Failed to fetch feed: ${fetchResult.error}`);
      }

      // 2. Detect format
      const format = feedFetcher.detectFormat(fetchResult.data, fetchResult.contentType);
      if (format === 'unknown') {
        const dataPreview = typeof fetchResult.data === 'string' 
          ? fetchResult.data.substring(0, 200) 
          : JSON.stringify(fetchResult.data).substring(0, 200);
        throw new Error(`Could not detect feed format. Expected XML, CSV, or JSON. Data preview: ${dataPreview}`);
      }

      // 3. Parse feed
      const parsedData = await feedFetcher.parseFeed(fetchResult.data, format);

      // 4. Detect provider
      const provider = feedProviderDetector.detect(parsedData, format);

      // 5. Map vehicles
      const mappedVehicles = feedMapper.mapVehicles(parsedData, format, provider);
      stats.vehicles_found = mappedVehicles.length;

      if (mappedVehicles.length === 0) {
        throw new Error('No vehicles found in feed');
      }

      // 6. Find or create dealer feed record
      let dealerFeed = await DealerFeed.findOne({
        dealerId, 
        feedUrl
      });

      if (!dealerFeed) {
        dealerFeed = await DealerFeed.create({
          dealerId,
          feedUrl,
          feedType: format,
          provider
        });
      }

      // 7. Process each vehicle
      for (const mappedVehicle of mappedVehicles) {
        try {
          const result = await this.processVehicle(
            dealerId,
            dealerFeed._id,
            mappedVehicle,
            options
          );

          if (result.action === 'imported') stats.vehicles_imported++;
          if (result.action === 'updated') stats.vehicles_updated++;
          if (result.images) stats.images_imported += result.images;

        } catch (error) {
          stats.errors.push({
            stockId: mappedVehicle.stock_id,
            error: error.message
          });
        }
      }

      // 8. Mark vehicles as sold if they disappeared from feed
      if (options.removeSoldVehicles !== false) {
        const currentStockIds = mappedVehicles.map(v => v.stock_id);
        const archived = await this.archiveMissingVehicles(
          dealerId,
          dealerFeed._id,
          currentStockIds
        );
        stats.vehicles_archived = archived;
      }

      // 9. Update feed last sync
      await DealerFeed.findByIdAndUpdate(dealerFeed._id, {
        lastSync: new Date(),
        provider,
        status: 'active'
      });

      // 10. Create log entry
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

      return {
        success: true,
        stats,
        duration,
        provider,
        format
      };

    } catch (error) {
      // Log error
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
      vehicles_skipped: 0, // Track cars that were skipped (already published)
      vehicles_archived: 0,
      images_imported: 0,
      unsplash_images_used: 0,
      limit_applied: false,
      errors: []
    };

    try {
      // Check subscription limits
      const subscription = await this.checkSubscriptionLimits(dealerId);
      
      // 1. Fetch and parse feed (same as before)
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

      // 2. Apply subscription limits and selection BEFORE processing
      if (options.limitVehicles && subscription.listingsLimit) {
        const availableSlots = Math.max(0, subscription.listingsLimit - subscription.listingsUsed);
        
        console.log(`🔒 [Feed Import] Subscription check:`, {
          limit: subscription.listingsLimit,
          used: subscription.listingsUsed,
          available: availableSlots,
          foundInFeed: mappedVehicles.length
        });
        
        if (availableSlots <= 0) {
          throw new Error(`Subscription limit reached. You have used ${subscription.listingsUsed} out of ${subscription.listingsLimit} listings. Please upgrade your plan to import more vehicles.`);
        }
        
        if (availableSlots < mappedVehicles.length) {
          console.log(`⚠️  [Feed Import] Applying limit: reducing from ${mappedVehicles.length} to ${availableSlots} vehicles`);
          mappedVehicles = this.applyVehicleSelection(mappedVehicles, availableSlots, options.selectionMode);
          stats.limit_applied = true;
        }
      } else if (subscription.listingsLimit) {
        // Even if limitVehicles is false, prevent going over limit
        const availableSlots = Math.max(0, subscription.listingsLimit - subscription.listingsUsed);
        
        if (availableSlots <= 0) {
          throw new Error(`Subscription limit reached. You have used ${subscription.listingsUsed} out of ${subscription.listingsLimit} listings. No more vehicles can be imported.`);
        }
        
        if (availableSlots < mappedVehicles.length) {
          console.log(`🚫 [Feed Import] Hard limit enforced: reducing from ${mappedVehicles.length} to ${availableSlots} vehicles`);
          mappedVehicles = mappedVehicles.slice(0, availableSlots);
          stats.limit_applied = true;
        }
      }

      // 3. Find or create dealer feed record
      let dealerFeed = await DealerFeed.findOne({ dealerId, feedUrl });
      if (!dealerFeed) {
        dealerFeed = await DealerFeed.create({
          dealerId,
          feedUrl,
          feedType: format,
          provider
        });
      }

      // 4. Process each vehicle with enhanced image processing
      let processedCount = 0;
      for (const mappedVehicle of mappedVehicles) {
        try {
          // Double-check subscription limit before each vehicle
          if (subscription.listingsLimit) {
            const currentUsage = await this.getCurrentListingUsage(dealerId);
            if (currentUsage >= subscription.listingsLimit) {
              console.log(`🚫 [Feed Import] Stopping import - subscription limit ${subscription.listingsLimit} reached`);
              stats.errors.push({
                stockId: mappedVehicle.stock_id,
                error: `Subscription limit ${subscription.listingsLimit} reached. Vehicle not imported.`
              });
              break; // Stop processing more vehicles
            }
          }

          const result = await this.processVehicleEnhanced(
            dealerId,
            dealerFeed._id,
            mappedVehicle,
            options
          );

          if (result.action === 'imported') {
            stats.vehicles_imported++;
            processedCount++;
          } else if (result.action === 'updated') {
            stats.vehicles_updated++;
          } else if (result.action === 'skipped') {
            // Track skipped cars (already published)
            stats.vehicles_skipped = (stats.vehicles_skipped || 0) + 1;
            console.log(`⏭️  [Feed Import] Skipped published car: ${mappedVehicle.make} ${mappedVehicle.model} (${mappedVehicle.stock_id})`);
          }
          
          if (result.images) stats.images_imported += result.images;
          if (result.unsplashImages) stats.unsplash_images_used += result.unsplashImages;

        } catch (error) {
          stats.errors.push({
            stockId: mappedVehicle.stock_id,
            error: error.message
          });
        }
      }

      // 5. Archive missing vehicles if enabled
      if (options.removeSoldVehicles !== false) {
        const currentStockIds = mappedVehicles.map(v => v.stock_id);
        const archived = await this.archiveMissingVehicles(dealerId, dealerFeed._id, currentStockIds);
        stats.vehicles_archived = archived;
      }

      // 10. Update feed last sync
      await DealerFeed.findByIdAndUpdate(dealerFeed._id, {
        lastSync: new Date(),
        provider,
        status: 'active'
      });

      // 11. Create log entry
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

      // 12. Optional cleanup of cars without images (disabled for testing)
      if (options.deleteVehiclesWithoutImages !== false) {
        console.log('🗑️ [Feed Import] Image cleanup scheduled (disabled for testing)');
        
        // Wait 30 seconds for image processing to complete, then cleanup
        setTimeout(async () => {
          try {
            // const imageCleanupService = require('./imageCleanupService');
            // const cleanupStats = await imageCleanupService.enforceImageRequirements(dealerId, {
            //   minImages: 1,
            //   deleteWithoutImages: true,
            //   deleteWithBrokenImages: true
            // });
            
            console.log(`✅ [Post-Import Cleanup] Image cleanup temporarily disabled for testing`);
          } catch (error) {
            console.error('❌ [Post-Import Cleanup] Failed:', error.message);
          }
        }, 30000);
      }

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
        return vehicles
          .sort((a, b) => (b.price || 0) - (a.price || 0))
          .slice(0, limit);
          
      case 'newest':
        return vehicles
          .sort((a, b) => new Date(b.date_added || 0) - new Date(a.date_added || 0))
          .slice(0, limit);
          
      case 'lowest-mileage':
        return vehicles
          .sort((a, b) => (a.mileage || 999999) - (b.mileage || 999999))
          .slice(0, limit);
          
      case 'first':
      default:
        return vehicles.slice(0, limit);
    }
  }

  /**
   * Enhanced vehicle processing with advanced image handling
   */
  async processVehicleEnhanced(dealerId, feedId, mappedVehicle, options = {}) {
    try {
      console.log('🔍 [processVehicleEnhanced] Input mappedVehicle:', {
        stockId: mappedVehicle.stock_id,
        make: mappedVehicle.make,
        model: mappedVehicle.model,
        registration: mappedVehicle.registration,
        allKeys: Object.keys(mappedVehicle)
      });

      // Process images using enhanced processor
      const imageResults = await feedImageProcessor.processVehicleImages(mappedVehicle, {
        useUnsplashFallback: options.useUnsplashFallback,
        uploadToCloudinary: options.uploadToCloudinary || true,
        maxImagesPerCar: options.maxImagesPerCar || 10
      });

      // Create or update feed vehicle record
      const existingFeedVehicle = await FeedVehicle.findOne({
        dealerId,
        feedId,
        stockId: mappedVehicle.stock_id
      });

      const feedVehicleData = {
        dealerId,
        feedId,
        stockId: mappedVehicle.stock_id,
        vehicleData: mappedVehicle, // This should contain all the car data
        hasVehicleData: true, // Explicitly set flag
        vehicleDataKeys: Object.keys(mappedVehicle), // Track available keys
        images: imageResults.processedImages,
        imageProcessingInfo: {
          totalProcessed: imageResults.totalProcessed,
          failedImages: imageResults.failedImages.length,
          unsplashUsed: imageResults.unsplashUsed
        },
        lastUpdated: new Date()
      };

      console.log('💾 [processVehicleEnhanced] feedVehicleData being saved:', {
        stockId: feedVehicleData.stockId,
        hasVehicleData: !!feedVehicleData.vehicleData,
        vehicleDataKeys: feedVehicleData.vehicleData ? Object.keys(feedVehicleData.vehicleData) : 'undefined',
        vehicleData: feedVehicleData.vehicleData
      });

      let feedVehicle;
      if (existingFeedVehicle) {
        // Update existing FeedVehicle
        feedVehicle = await FeedVehicle.findByIdAndUpdate(
          existingFeedVehicle._id,
          feedVehicleData,
          { new: true }
        );
        console.log(`♻️  [processVehicleEnhanced] Updated existing FeedVehicle: ${feedVehicle._id}`);
      } else {
        // Create new FeedVehicle with upsert to handle race conditions
        try {
          feedVehicle = await FeedVehicle.create(feedVehicleData);
          console.log(`🆕 [processVehicleEnhanced] Created new FeedVehicle: ${feedVehicle._id}`);
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error - someone else created it, try to update
            console.log(`🔄 [processVehicleEnhanced] Duplicate detected for stockId ${mappedVehicle.stock_id}, attempting update...`);
            const existingVehicle = await FeedVehicle.findOne({
              dealerId,
              feedId,
              stockId: mappedVehicle.stock_id
            });
            if (existingVehicle) {
              feedVehicle = await FeedVehicle.findByIdAndUpdate(
                existingVehicle._id,
                feedVehicleData,
                { new: true }
              );
              console.log(`✅ [processVehicleEnhanced] Updated after duplicate: ${feedVehicle._id}`);
            } else {
              throw error; // Re-throw if we can't find the duplicate
            }
          } else {
            throw error; // Re-throw other errors
          }
        }
      }

      // Create or update Car listing
      const carResult = await this.createOrUpdateCarListing(feedVehicle, options);

      return {
        action: carResult.action,
        images: imageResults.totalProcessed,
        unsplashImages: imageResults.unsplashUsed ? imageResults.processedImages.length : 0,
        feedVehicle,
        carListing: carResult.car
      };

    } catch (error) {
      console.error(`Error processing vehicle ${mappedVehicle.stock_id}:`, error);
      throw error;
    }
  }

  /**
   * Check subscription limits
   */
  async checkSubscriptionLimits(dealerId) {
    try {
      const TradeSubscription = require('../models/TradeSubscription');
      const subscription = await TradeSubscription.findOne({ 
        dealerId, 
        status: 'active' 
      }).populate('planId');

      return {
        listingsLimit: subscription?.planId?.listingsLimit || null,
        listingsUsed: subscription?.listingsUsed || 0,
        hasLimit: subscription?.planId?.listingsLimit !== null
      };
    } catch (error) {
      return { listingsLimit: null, listingsUsed: 0, hasLimit: false };
    }
  }

  /**
   * Process single vehicle (create or update)
   */
  async processVehicle(dealerId, feedId, mappedVehicle, options = {}) {
    // Find existing feed vehicle by stock_id or VIN or registration
    const searchCriteria = {
      dealerId,
      $or: [
        { stockId: mappedVehicle.stock_id }
      ]
    };

    if (mappedVehicle.vin) {
      searchCriteria.$or.push({ vin: mappedVehicle.vin });
    }

    if (mappedVehicle.registration) {
      searchCriteria.$or.push({ registration: mappedVehicle.registration });
    }

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
      // Create new feed vehicle
      feedVehicle = await FeedVehicle.create(vehicleData);
      action = 'imported';
    } else {
      // Update existing feed vehicle
      await FeedVehicle.findByIdAndUpdate(feedVehicle._id, vehicleData);
    }

    // Create or update Car listing
    let car = null; // Declare outside to use later
    if (options.createCarListings !== false) {
      car = await this.syncCarListing(dealerId, feedVehicle, mappedVehicle);
      
      if (car) {
        await FeedVehicle.findByIdAndUpdate(feedVehicle._id, { carId: car._id });
      } else {
        // Car creation failed - this is an error
        throw new Error('Failed to create/update car listing');
      }
    }

    // Import images - Always check and import
    console.log(`🔍 [Feed Import] Checking images for ${mappedVehicle.stock_id}:`);
    console.log(`   - options.importImages: ${options.importImages}`);
    console.log(`   - has images: ${!!(mappedVehicle.images && mappedVehicle.images.length > 0)}`);
    console.log(`   - images array:`, JSON.stringify(mappedVehicle.images));
    
    // Default importImages to TRUE if not explicitly set to false
    const shouldImportImages = options.importImages !== false;
    
    if (shouldImportImages && mappedVehicle.images && Array.isArray(mappedVehicle.images) && mappedVehicle.images.length > 0) {
      console.log(`📸 [Feed Import] Importing ${mappedVehicle.images.length} images for ${mappedVehicle.stock_id}`);
      try {
        imagesCount = await this.importImages(feedVehicle._id, mappedVehicle.images);
        console.log(`✅ [Feed Import] Saved ${imagesCount} FeedImage records to database`);
        
        // Process images asynchronously (download and upload to Cloudinary)
        if (car && imagesCount > 0) {
          console.log(`🖼️  [Feed Import] Starting async processing for car ${car._id}`);
          // Don't wait for image processing - do it in background
          this.processImagesAsync(feedVehicle._id, car._id).catch(err => {
            console.error(`Background image processing failed for vehicle ${feedVehicle._id}:`, err.message);
          });
        }
      } catch (error) {
        console.error(`❌ [Feed Import] Failed to import images for ${mappedVehicle.stock_id}:`, error.message);
      }
    } else {
      console.log(`⚠️  [Feed Import] Skipping images - shouldImport: ${shouldImportImages}, hasImages: ${!!(mappedVehicle.images && mappedVehicle.images.length > 0)}, isArray: ${Array.isArray(mappedVehicle.images)}, length: ${mappedVehicle.images?.length || 0}`);
    }

    return { action, images: imagesCount };
  }

  /**
   * Process images asynchronously (background job)
   */
  async processImagesAsync(feedVehicleId, carId) {
    try {
      await feedImageService.processVehicleImages(feedVehicleId, carId);
    } catch (error) {
      console.error('Async image processing error:', error);
    }
  }

  /**
   * Sync car listing from feed vehicle
   */
  async syncCarListing(dealerId, feedVehicle, mappedVehicle) {
    try {
      let car = null;

      // Try to find existing car
      if (feedVehicle.carId) {
        car = await Car.findById(feedVehicle.carId);
      }

      if (!car && mappedVehicle.registration) {
        car = await Car.findOne({
          registrationNumber: mappedVehicle.registration,
          dealerId
        });
      }

      // Try to get dealer's postcode, fallback to default
      let dealerPostcode = 'SW1A 1AA'; // Default London postcode
      try {
        const TradeDealer = require('../models/TradeDealer');
        const dealer = await TradeDealer.findById(dealerId).select('businessAddress');
        if (dealer?.businessAddress?.postcode) {
          dealerPostcode = dealer.businessAddress.postcode;
        }
      } catch (err) {
        console.log('Could not fetch dealer postcode, using default:', err.message);
      }

      // Normalize transmission to lowercase enum values
      let normalizedTransmission = null;
      if (mappedVehicle.transmission) {
        const trans = mappedVehicle.transmission.toLowerCase();
        if (trans.includes('auto') || trans.includes('automatic')) {
          normalizedTransmission = 'automatic';
        } else if (trans.includes('manual')) {
          normalizedTransmission = 'manual';
        } else if (trans.includes('semi')) {
          normalizedTransmission = 'semi-automatic';
        }
      }

      // Normalize fuel type to match enum
      let normalizedFuelType = mappedVehicle.fuel_type;
      if (normalizedFuelType) {
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
        normalizedFuelType = fuelMap[normalizedFuelType.toLowerCase()] || normalizedFuelType;
      }

      const carData = {
        dealerId,
        isDealerListing: true,
        registrationNumber: mappedVehicle.registration,
        make: mappedVehicle.make,
        model: mappedVehicle.model,
        variant: mappedVehicle.derivative, // derivative → variant
        year: mappedVehicle.year || new Date().getFullYear(), // Default to current year if missing
        mileage: mappedVehicle.mileage || 0, // Default to 0 if missing
        fuelType: normalizedFuelType || 'Petrol', // Default if missing
        transmission: normalizedTransmission || 'manual', // Default if missing
        color: mappedVehicle.colour || 'Not Specified', // colour → color, with default
        price: mappedVehicle.price,
        description: mappedVehicle.description || `${mappedVehicle.make} ${mappedVehicle.model}`, // Default description
        postcode: dealerPostcode, // Use dealer's postcode or default
        advertStatus: 'active',
        dataSource: 'manual',
        condition: 'used',
        skipNormalization: true
      };

      // Set flag to skip API calls during feed import (DVLA, Valuation, Variant fetch)
      // This prevents automatic API charges for bulk feed imports
      const skipAPIFetchFlag = { skipAPIFetch: true };

      if (car) {
        // Update existing car
        car.$locals = skipAPIFetchFlag;
        await Car.findByIdAndUpdate(car._id, carData);
      } else {
        // Create new car with skipAPIFetch flag
        car = new Car(carData);
        car.$locals = skipAPIFetchFlag;
        await car.save();
      }

      return car;

    } catch (error) {
      console.error('Error syncing car listing:', error);
      console.error('Failed vehicle data:', {
        stockId: mappedVehicle.stock_id,
        registration: mappedVehicle.registration,
        make: mappedVehicle.make,
        model: mappedVehicle.model
      });
      return null;
    }
  }

  /**
   * Import images for vehicle
   */
  async importImages(feedVehicleId, images) {
    let count = 0;

    try {
      console.log(`🗑️  [importImages] Deleting old images for feedVehicleId: ${feedVehicleId}`);
      // Delete old images
      const deleteResult = await FeedImage.deleteMany({ feedVehicleId });
      console.log(`   Deleted ${deleteResult.deletedCount} old images`);

      // Create new image records
      console.log(`💾 [importImages] Creating ${images.length} new image records...`);
      for (const image of images) {
        try {
          console.log(`   Creating image ${count + 1}: ${image.url}`);
          const feedImage = await FeedImage.create({
            feedVehicleId,
            sourceUrl: image.url,
            imageOrder: image.order !== undefined ? image.order : count,
            downloadStatus: 'pending'
          });
          console.log(`   ✓ Created FeedImage with ID: ${feedImage._id}`);
          count++;
        } catch (error) {
          console.error(`   ✗ Error creating image record for ${image.url}:`, error.message);
        }
      }

      console.log(`✅ [importImages] Successfully created ${count} image records`);
      return count;
    } catch (error) {
      console.error('❌ [importImages] Fatal error:', error);
      throw error;
    }
  }

  /**
   * Archive vehicles that are no longer in feed
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

      // Also update the car listing
      if (vehicle.carId) {
        const car = await Car.findById(vehicle.carId);
        if (car) {
          await Car.findByIdAndUpdate(car._id, { status: 'sold' });
        }
      }

      count++;
    }

    return count;
  }

  /**
   * Create or update Car listing from FeedVehicle
   */
  async createOrUpdateCarListing(feedVehicle, options = {}) {
    try {
      // Debug logging
      console.log('🔍 [createOrUpdateCarListing] Input feedVehicle:', {
        id: feedVehicle._id,
        hasVehicleData: !!feedVehicle.vehicleData,
        vehicleDataKeys: feedVehicle.vehicleData ? Object.keys(feedVehicle.vehicleData) : 'undefined'
      });

      const mappedVehicle = feedVehicle.vehicleData || {};
      
      // Debug logging for mappedVehicle
      console.log('🔍 [createOrUpdateCarListing] mappedVehicle:', {
        stockId: mappedVehicle.stock_id,
        registration: mappedVehicle.registration,
        make: mappedVehicle.make,
        model: mappedVehicle.model,
        allKeys: Object.keys(mappedVehicle)
      });

      let car = null;

      // Try to find existing car
      if (feedVehicle.carId) {
        car = await Car.findById(feedVehicle.carId);
      }

      // Safe check for registration
      if (!car && mappedVehicle.registration) {
        car = await Car.findOne({
          registrationNumber: mappedVehicle.registration,
          dealerId: feedVehicle.dealerId
        });
      }

      // 🚫 SKIP PUBLISHED CARS - Don't update cars that are already active/published
      if (car && car.advertStatus === 'active') {
        console.log(`🚫 [createOrUpdateCarListing] Skipping published car: ${car.make} ${car.model} (${car.registrationNumber}) - Status: ${car.advertStatus}`);
        return { 
          action: 'skipped', 
          car,
          reason: 'Car is already published/active'
        };
      }

      // Try to get dealer's postcode, fallback to default
      let dealerPostcode = 'SW1A 1AA'; // Default London postcode
      try {
        const TradeDealer = require('../models/TradeDealer');
        const dealer = await TradeDealer.findById(feedVehicle.dealerId).select('businessAddress');
        if (dealer?.businessAddress?.postcode) {
          dealerPostcode = dealer.businessAddress.postcode;
        }
      } catch (err) {
        console.log('Could not fetch dealer postcode, using default:', err.message);
      }

      // Normalize transmission to lowercase enum values
      let normalizedTransmission = 'manual'; // Default
      if (mappedVehicle.transmission) {
        const trans = mappedVehicle.transmission.toLowerCase();
        if (trans.includes('auto') || trans.includes('automatic')) {
          normalizedTransmission = 'automatic';
        } else if (trans.includes('manual')) {
          normalizedTransmission = 'manual';
        } else if (trans.includes('semi')) {
          normalizedTransmission = 'semi-automatic';
        }
      }

      // Normalize fuel type to match enum
      let normalizedFuelType = 'Petrol'; // Default
      if (mappedVehicle.fuel_type) {
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
        normalizedFuelType = fuelMap[mappedVehicle.fuel_type.toLowerCase()] || mappedVehicle.fuel_type;
      }

      // Add images from feedVehicle to Car model
      let imageUrls = [];
      if (feedVehicle.images && feedVehicle.images.length > 0) {
        imageUrls = feedVehicle.images.map(img => img.processedUrl || img.sourceUrl || img.url).filter(Boolean);
        console.log(`🖼️  [createOrUpdateCarListing] Found ${imageUrls.length} images in feedVehicle.images`);
      } else if (mappedVehicle.images && mappedVehicle.images.length > 0) {
        // Fallback to original images from feed
        imageUrls = mappedVehicle.images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
        console.log(`🖼️  [createOrUpdateCarListing] Found ${imageUrls.length} images in mappedVehicle.images`);
      } else {
        console.log(`⚠️  [createOrUpdateCarListing] No images found in feedVehicle or mappedVehicle`);
      }

      const carData = {
        dealerId: feedVehicle.dealerId,
        isDealerListing: true,
        registrationNumber: mappedVehicle.registration || 'TBD' + Date.now(), // Generate temp reg if missing
        make: mappedVehicle.make || 'Unknown',
        model: mappedVehicle.model || 'Unknown',
        variant: mappedVehicle.derivative || null,
        year: mappedVehicle.year || new Date().getFullYear(),
        mileage: mappedVehicle.mileage || 0,
        fuelType: normalizedFuelType,
        transmission: normalizedTransmission,
        color: mappedVehicle.colour || mappedVehicle.color || 'Not Specified',
        price: mappedVehicle.price || 0,
        description: mappedVehicle.description || `${mappedVehicle.make || 'Unknown'} ${mappedVehicle.model || 'Unknown'}`,
        postcode: dealerPostcode,
        advertStatus: 'draft', // 📝 Always import as draft, not active
        dataSource: 'manual',
        condition: 'used',
        skipNormalization: true,
        images: imageUrls // Add images directly to car
      };

      console.log('💾 [createOrUpdateCarListing] Final carData:', {
        make: carData.make,
        model: carData.model,
        registration: carData.registrationNumber,
        price: carData.price,
        imageCount: carData.images.length,
        advertStatus: carData.advertStatus
      });

      // Set flag to skip API calls during feed import
      const skipAPIFetchFlag = { skipAPIFetch: true };
      let action = 'updated';

      if (car) {
        // Update existing car (only if not active)
        car.$locals = skipAPIFetchFlag;
        await Car.findByIdAndUpdate(car._id, carData);
        console.log('✅ [createOrUpdateCarListing] Updated existing car:', car._id);
      } else {
        // Create new car
        car = new Car(carData);
        car.$locals = skipAPIFetchFlag;
        await car.save();
        action = 'imported';
        console.log('✅ [createOrUpdateCarListing] Created new car:', car._id);
      }

      // Update feedVehicle with carId
      if (car && !feedVehicle.carId) {
        await FeedVehicle.findByIdAndUpdate(feedVehicle._id, { carId: car._id });
      }

      return { action, car };

    } catch (error) {
      console.error('❌ [createOrUpdateCarListing] Error:', error);
      console.error('❌ [createOrUpdateCarListing] feedVehicle:', feedVehicle);
      throw error;
    }
  }

  /**
   * Get feed logs for dealer
   */
  async getFeedLogs(dealerId, limit = 20) {
    return await FeedLog.find({ dealerId })
      .sort({ syncTime: -1 })
      .limit(limit);
  }

  /**
   * Get dealer feeds
   */
  async getDealerFeeds(dealerId) {
    return await DealerFeed.find({ dealerId })
      .sort({ createdAt: -1 });
  }
}

module.exports = new FeedImportService();
