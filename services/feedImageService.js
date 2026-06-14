/**
 * Feed Image Download and Upload Service
 * Downloads images from dealer feeds and uploads to Cloudinary
 */
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const FeedImage = require('../models/FeedImage');
const Car = require('../models/Car');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class FeedImageService {

  /**
   * Download and upload images for a vehicle
   * @param {string} feedVehicleId - FeedVehicle ID
   * @param {string} carId - Car ID
   * @returns {Promise<number>} - Number of images successfully uploaded
   */
  async processVehicleImages(feedVehicleId, carId) {
    try {
      // Get all pending images for this vehicle
      const feedImages = await FeedImage.find({
        feedVehicleId,
        downloadStatus: 'pending'
      }).sort({ imageOrder: 1 });

      if (feedImages.length === 0) {
        console.log(`No pending images for vehicle ${feedVehicleId}`);
        return 0;
      }

      console.log(`Processing ${feedImages.length} images for vehicle ${feedVehicleId}`);

      const uploadedUrls = [];
      let successCount = 0;

      for (const feedImage of feedImages) {
        try {
          // Download and upload to Cloudinary
          const cloudinaryUrl = await this.downloadAndUpload(
            feedImage.sourceUrl,
            carId,
            feedImage.imageOrder
          );

          if (cloudinaryUrl) {
            uploadedUrls.push(cloudinaryUrl);
            successCount++;

            // Update FeedImage status
            await FeedImage.findByIdAndUpdate(feedImage._id, {
              downloadStatus: 'completed',
              cloudinaryUrl,
              downloadedAt: new Date()
            });
          } else {
            // Mark as failed
            await FeedImage.findByIdAndUpdate(feedImage._id, {
              downloadStatus: 'failed',
              errorMessage: 'Upload failed'
            });
          }

        } catch (error) {
          console.error(`Error processing image ${feedImage.sourceUrl}:`, error.message);
          
          // Mark as failed
          await FeedImage.findByIdAndUpdate(feedImage._id, {
            downloadStatus: 'failed',
            errorMessage: error.message
          });
        }
      }

      // Update Car with uploaded image URLs
      if (uploadedUrls.length > 0) {
        await Car.findByIdAndUpdate(carId, {
          images: uploadedUrls
        });
        console.log(`✅ Updated car ${carId} with ${uploadedUrls.length} images`);
      }

      return successCount;

    } catch (error) {
      console.error('Error processing vehicle images:', error);
      return 0;
    }
  }

  /**
   * Download image from URL and upload to Cloudinary
   * @param {string} sourceUrl - Image source URL
   * @param {string} carId - Car ID for folder organization
   * @param {number} imageOrder - Image order/index
   * @returns {Promise<string|null>} - Cloudinary URL or null if failed
   */
  async downloadAndUpload(sourceUrl, carId, imageOrder = 0) {
    try {
      // Validate URL
      if (!sourceUrl || !sourceUrl.startsWith('http')) {
        console.warn(`Invalid image URL: ${sourceUrl}`);
        return null;
      }

      console.log(`Downloading image: ${sourceUrl}`);

      // Download image
      const response = await axios.get(sourceUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        headers: {
          'User-Agent': 'CarCatalog Feed Importer/1.0'
        }
      });

      // Check if it's actually an image
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        console.warn(`Not an image: ${contentType}`);
        return null;
      }

      // Convert to base64
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      const dataURI = `data:${contentType};base64,${base64Image}`;

      // Upload to Cloudinary
      console.log(`Uploading to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: `carcatalog/feed-vehicles/${carId}`,
        public_id: `image_${imageOrder}`,
        overwrite: true,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto'
      });

      console.log(`✅ Uploaded: ${uploadResult.secure_url}`);
      return uploadResult.secure_url;

    } catch (error) {
      if (error.response) {
        console.error(`HTTP Error ${error.response.status}: ${sourceUrl}`);
      } else if (error.code === 'ECONNABORTED') {
        console.error(`Timeout downloading: ${sourceUrl}`);
      } else {
        console.error(`Error downloading/uploading image:`, error.message);
      }
      return null;
    }
  }

  /**
   * Retry failed images for a vehicle
   * @param {string} feedVehicleId - FeedVehicle ID
   * @param {string} carId - Car ID
   * @returns {Promise<number>} - Number of images successfully uploaded
   */
  async retryFailedImages(feedVehicleId, carId) {
    try {
      // Reset failed images to pending
      await FeedImage.updateMany(
        { feedVehicleId, downloadStatus: 'failed' },
        { downloadStatus: 'pending', errorMessage: null }
      );

      // Process them again
      return await this.processVehicleImages(feedVehicleId, carId);

    } catch (error) {
      console.error('Error retrying failed images:', error);
      return 0;
    }
  }

  /**
   * Get image statistics for a feed
   * @param {string} feedId - Feed ID
   * @returns {Promise<object>} - Statistics object
   */
  async getImageStats(feedId) {
    try {
      const stats = await FeedImage.aggregate([
        {
          $lookup: {
            from: 'feedvehicles',
            localField: 'feedVehicleId',
            foreignField: '_id',
            as: 'vehicle'
          }
        },
        {
          $match: {
            'vehicle.feedId': feedId
          }
        },
        {
          $group: {
            _id: '$downloadStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      return result;

    } catch (error) {
      console.error('Error getting image stats:', error);
      return { total: 0, pending: 0, completed: 0, failed: 0 };
    }
  }

  /**
   * Clean up old images for deleted vehicles
   * @param {string} carId - Car ID
   */
  async deleteVehicleImages(carId) {
    try {
      // Delete from Cloudinary
      const folderPath = `carcatalog/feed-vehicles/${carId}`;
      await cloudinary.api.delete_resources_by_prefix(folderPath);
      await cloudinary.api.delete_folder(folderPath);

      console.log(`✅ Deleted Cloudinary folder: ${folderPath}`);

    } catch (error) {
      console.error('Error deleting vehicle images:', error);
    }
  }
}

module.exports = new FeedImageService();
