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
    return;
  }

  isRunning = true;

  try {
    // Find all feed vehicles with pending images
    const pendingImages = await FeedImage.find({
      downloadStatus: 'pending'
    }).limit(50); // Process max 50 images per run

    if (pendingImages.length === 0) {
      isRunning = false;
      return;
    }
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
          continue;
        }

        // Process images for this vehicle
        const result = await feedImageService.processVehicleImages(
          feedVehicleId,
          feedVehicle.carId
        );

        totalProcessed += vehicleGroups[feedVehicleId].length;
        totalSuccessful += result.success; // Use result.success instead of the whole object

      } catch (error) {
      }
    }
  } catch (error) {
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
