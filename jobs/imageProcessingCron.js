/**
 * Background Image Processing Cron Job
 * Processes pending feed images and uploads them to Cloudinary
 * Runs every 5 minutes
 */
const cron = require('node-cron');
const FeedImage = require('../models/FeedImage');
const FeedVehicle = require('../models/FeedVehicle');
const feedImageService = require('../services/feedImageService');

// Track if job is running
let isRunning = false;

/**
 * Process pending images
 */
async function processPendingImages() {
  if (isRunning) {
    console.log('⏭️  Image processing already running, skipping...');
    return;
  }

  isRunning = true;

  try {
    console.log('\n🖼️  Starting image processing job...');

    // Find all feed vehicles with pending images
    const pendingImages = await FeedImage.find({
      downloadStatus: 'pending'
    }).limit(50); // Process max 50 images per run

    if (pendingImages.length === 0) {
      console.log('✅ No pending images to process');
      isRunning = false;
      return;
    }

    console.log(`📊 Found ${pendingImages.length} pending images`);

    // Group by feedVehicleId
    const vehicleGroups = {};
    for (const image of pendingImages) {
      const vid = image.feedVehicleId.toString();
      if (!vehicleGroups[vid]) {
        vehicleGroups[vid] = [];
      }
      vehicleGroups[vid].push(image);
    }

    let totalProcessed = 0;
    let totalSuccessful = 0;

    // Process each vehicle's images
    for (const feedVehicleId of Object.keys(vehicleGroups)) {
      try {
        // Get the car ID
        const feedVehicle = await FeedVehicle.findById(feedVehicleId);
        
        if (!feedVehicle || !feedVehicle.carId) {
          console.warn(`⚠️  No car linked for feed vehicle ${feedVehicleId}`);
          continue;
        }

        // Process images for this vehicle
        const successCount = await feedImageService.processVehicleImages(
          feedVehicleId,
          feedVehicle.carId
        );

        totalProcessed += vehicleGroups[feedVehicleId].length;
        totalSuccessful += successCount;

      } catch (error) {
        console.error(`Error processing vehicle ${feedVehicleId}:`, error.message);
      }
    }

    console.log(`✅ Image processing complete: ${totalSuccessful}/${totalProcessed} successful`);

  } catch (error) {
    console.error('❌ Image processing job error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cron job
 */
function startImageProcessingCron() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    processPendingImages();
  });

  console.log('✓ Image processing cron job started (runs every 5 minutes)');
}

module.exports = { startImageProcessingCron, processPendingImages };
