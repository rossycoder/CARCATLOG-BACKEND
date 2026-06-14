const feedFetcher = require('./feedFetcher');
const feedProviderDetector = require('./feedProviderDetector');
const feedMapper = require('./feedMapper');
const feedImageService = require('./feedImageService');
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
