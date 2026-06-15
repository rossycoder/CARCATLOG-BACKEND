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
        throw new Error('No vehicles found in feed');
      }

      let dealerFeed = await DealerFeed.findOne({ dealerId, feedUrl });
      if (!dealerFeed) {
        dealerFeed = await DealerFeed.create({ dealerId, feedUrl, feedType: format, provider });
      }

      for (const mappedVehicle of mappedVehicles) {
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
        const availableSlots = Math.max(0, subscription.listingsLimit - subscription.listingsUsed);

        console.log(`🔒 [Feed Import] Subscription check:`, {
          limit: subscription.listingsLimit,
          used: subscription.listingsUsed,
          available: availableSlots,
          foundInFeed: mappedVehicles.length
        });

        if (availableSlots <= 0) {
          throw new Error(`Subscription limit reached. You have used ${subscription.listingsUsed} out of ${subscription.listingsLimit} listings.`);
        }

        if (availableSlots < mappedVehicles.length) {
          console.log(`⚠️  [Feed Import] Applying limit: reducing from ${mappedVehicles.length} to ${availableSlots} vehicles`);
          mappedVehicles = options.limitVehicles
            ? this.applyVehicleSelection(mappedVehicles, availableSlots, options.selectionMode)
            : mappedVehicles.slice(0, availableSlots);
          stats.limit_applied = true;
        }
      }

      let dealerFeed = await DealerFeed.findOne({ dealerId, feedUrl });
      if (!dealerFeed) {
        dealerFeed = await DealerFeed.create({ dealerId, feedUrl, feedType: format, provider });
      }

      for (const mappedVehicle of mappedVehicles) {
        try {
          // Double-check limit before each vehicle
          if (subscription.listingsLimit) {
            const currentUsage = await this.getCurrentListingUsage(dealerId);
            if (currentUsage >= subscription.listingsLimit) {
              console.log(`🚫 [Feed Import] Stopping - subscription limit reached`);
              stats.errors.push({
                stockId: mappedVehicle.stock_id,
                error: `Subscription limit ${subscription.listingsLimit} reached.`
              });
              break;
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
      console.log('🔍 [processVehicleEnhanced] Processing:', {
        stockId: mappedVehicle.stock_id,
        make: mappedVehicle.make,
        model: mappedVehicle.model,
        imageCount: mappedVehicle.images?.length || 0
      });

      // ── Step 1: Save/update FeedVehicle record ─────────────────────────────
      const existingFeedVehicle = await FeedVehicle.findOne({ dealerId, feedId, stockId: mappedVehicle.stock_id });

      const feedVehicleData = {
        dealerId,
        feedId,
        stockId: mappedVehicle.stock_id,
        vehicleData: mappedVehicle,
        hasVehicleData: true,
        vehicleDataKeys: Object.keys(mappedVehicle),
        // Normalize images from feed into FeedVehicle format
        images: this.normalizeImagesForFeedVehicle(mappedVehicle.images),
        lastUpdated: new Date()
      };

      let feedVehicle;
      if (existingFeedVehicle) {
        feedVehicle = await FeedVehicle.findByIdAndUpdate(existingFeedVehicle._id, feedVehicleData, { new: true });
        console.log(`♻️  [processVehicleEnhanced] Updated FeedVehicle: ${feedVehicle._id}`);
      } else {
        try {
          feedVehicle = await FeedVehicle.create(feedVehicleData);
          console.log(`🆕 [processVehicleEnhanced] Created FeedVehicle: ${feedVehicle._id}`);
        } catch (error) {
          if (error.code === 11000) {
            // Race condition — find and update
            const existing = await FeedVehicle.findOne({ dealerId, feedId, stockId: mappedVehicle.stock_id });
            if (existing) {
              feedVehicle = await FeedVehicle.findByIdAndUpdate(existing._id, feedVehicleData, { new: true });
              console.log(`✅ [processVehicleEnhanced] Updated after duplicate: ${feedVehicle._id}`);
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      // ── Step 2: Create/update Car listing ─────────────────────────────────
      const carResult = await this.createOrUpdateCarListing(feedVehicle, options);

      // ── Step 3: Save image records to DB and process in background ─────────
      let imagesCount = 0;
      let unsplashUsed = false;

      const imageList = mappedVehicle.images || [];

      if (imageList.length > 0) {
        // Save FeedImage records (pending download)
        imagesCount = await this.importImages(feedVehicle._id, imageList);

        // Kick off background download → Cloudinary → Car.images update
        if (carResult.car && imagesCount > 0) {
          console.log(`🖼️  [processVehicleEnhanced] Background image processing for car ${carResult.car._id}`);
          this.processImagesAsync(feedVehicle._id, carResult.car._id).catch(err => {
            console.error(`Background image processing failed for ${feedVehicle._id}:`, err.message);
          });
        }

      } else if (options.useUnsplashFallback) {
        // No images in feed — use Unsplash fallback
        const make = mappedVehicle.make || 'car';
        const model = mappedVehicle.model || '';
        const unsplashUrls = [
          `https://source.unsplash.com/800x600/?${encodeURIComponent(make + ' ' + model)}`,
          `https://source.unsplash.com/800x600/?${encodeURIComponent(make)}`,
          `https://source.unsplash.com/800x600/?car`
        ];

        if (carResult.car) {
          // Process Unsplash URLs directly through enhanced service
          const cloudinaryUrls = await feedImageService.processImageUrls(unsplashUrls, carResult.car._id.toString());
          if (cloudinaryUrls.length > 0) {
            await Car.findByIdAndUpdate(carResult.car._id, { images: cloudinaryUrls });
            imagesCount = cloudinaryUrls.length;
            unsplashUsed = true;
            console.log(`🌄 [processVehicleEnhanced] Used ${cloudinaryUrls.length} Unsplash images`);
          }
        }
      }

      return {
        action: carResult.action,
        images: imagesCount,
        unsplashImages: unsplashUsed ? imagesCount : 0,
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
      const subscription = await TradeSubscription.findOne({ dealerId, status: 'active' }).populate('planId');
      return {
        listingsLimit: subscription?.planId?.listingsLimit || null,
        listingsUsed: subscription?.listingsUsed || 0,
        hasLimit: !!subscription?.planId?.listingsLimit
      };
    } catch (error) {
      return { listingsLimit: null, listingsUsed: 0, hasLimit: false };
    }
  }

  /**
   * Get current listing usage count
   */
  async getCurrentListingUsage(dealerId) {
    try {
      return await Car.countDocuments({ dealerId, advertStatus: 'active' });
    } catch (error) {
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

      if (feedVehicle.carId) car = await Car.findById(feedVehicle.carId);
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

      const carData = {
        dealerId,
        isDealerListing: true,
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
        advertStatus: 'active',
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
   * Create or update Car listing from FeedVehicle
   */
  async createOrUpdateCarListing(feedVehicle, options = {}) {
    try {
      const mappedVehicle = feedVehicle.vehicleData || {};

      let car = null;
      if (feedVehicle.carId) car = await Car.findById(feedVehicle.carId);
      if (!car && mappedVehicle.registration) {
        car = await Car.findOne({ registrationNumber: mappedVehicle.registration, dealerId: feedVehicle.dealerId });
      }

      // Skip cars already published — don't overwrite dealer edits
      if (car && car.advertStatus === 'active') {
        console.log(`🚫 [createOrUpdateCarListing] Skipping active car: ${car.make} ${car.model} (${car.registrationNumber})`);
        return { action: 'skipped', car, reason: 'Already published' };
      }

      let dealerPostcode = 'SW1A 1AA';
      try {
        const TradeDealer = require('../models/TradeDealer');
        const dealer = await TradeDealer.findById(feedVehicle.dealerId).select('businessAddress');
        if (dealer?.businessAddress?.postcode) dealerPostcode = dealer.businessAddress.postcode;
      } catch (err) {}

      // Get image URLs — prefer already-processed Cloudinary URLs
      let imageUrls = [];
      if (feedVehicle.images?.length > 0) {
        imageUrls = feedVehicle.images
          .map(img => img.processedUrl || img.sourceUrl || img.url)
          .filter(Boolean);
      } else if (mappedVehicle.images?.length > 0) {
        imageUrls = mappedVehicle.images
          .map(img => typeof img === 'string' ? img : img?.url)
          .filter(Boolean);
      }

      const carData = {
        dealerId: feedVehicle.dealerId,
        isDealerListing: true,
        registrationNumber: mappedVehicle.registration || `TBD${Date.now()}`,
        make: mappedVehicle.make || 'Unknown',
        model: mappedVehicle.model || 'Unknown',
        variant: mappedVehicle.derivative || null,
        year: mappedVehicle.year || new Date().getFullYear(),
        mileage: mappedVehicle.mileage || 0,
        fuelType: this.normalizeFuelType(mappedVehicle.fuel_type) || 'Petrol',
        transmission: this.normalizeTransmission(mappedVehicle.transmission) || 'manual',
        color: mappedVehicle.colour || mappedVehicle.color || 'Not Specified',
        price: mappedVehicle.price || 0,
        description: mappedVehicle.description || `${mappedVehicle.make || 'Unknown'} ${mappedVehicle.model || 'Unknown'}`,
        postcode: dealerPostcode,
        advertStatus: 'active',
        dataSource: 'manual',
        condition: 'used',
        skipNormalization: true,
        images: imageUrls
      };

      const skipAPIFetchFlag = { skipAPIFetch: true };
      let action = 'updated';

      if (car) {
        car.$locals = skipAPIFetchFlag;
        await Car.findByIdAndUpdate(car._id, carData);
        console.log('✅ [createOrUpdateCarListing] Updated car:', car._id);
      } else {
        car = new Car(carData);
        car.$locals = skipAPIFetchFlag;
        await car.save();
        action = 'imported';
        console.log('✅ [createOrUpdateCarListing] Created car:', car._id);
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