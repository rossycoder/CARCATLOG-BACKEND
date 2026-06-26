/**
 * Enhanced Feed Image Processor
 * Handles different image formats and sources from feeds
 * Downloads images from ANY source and uploads to Cloudinary
 */

const axios = require('axios');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class FeedImageProcessor {

  /**
   * Process images from feed vehicle data
   * Supports: Direct URLs, Google Drive, Dropbox, Base64, Unsplash - ALL uploaded to Cloudinary
   */
  async processVehicleImages(vehicleData, options = {}) {
    const results = {
      processedImages: [],
      failedImages: [],
      unsplashUsed: false,
      totalProcessed: 0
    };

    try {
      // Extract all possible image sources from vehicle data
      const imageUrls = this.extractImageUrls(vehicleData);
      if (imageUrls.length === 0) {
        // No images found - use Unsplash if enabled
        if (options.useUnsplashFallback) {
          const unsplashImages = await this.generateAndUploadUnsplashImages(vehicleData);
          results.processedImages = unsplashImages;
          results.unsplashUsed = true;
          results.totalProcessed = unsplashImages.length;
        }
        return results;
      }

      // Process each image URL - ALWAYS upload to Cloudinary
      for (const imageUrl of imageUrls.slice(0, 10)) { // Limit to 10 images
        try {
          console.log(`📸 [FeedImageProcessor] Processing image: ${imageUrl.substring(0, 80)}...`);
          const cloudinaryUrl = await this.downloadAndUploadToCloudinary(imageUrl, vehicleData);
          
          if (cloudinaryUrl) {
            results.processedImages.push(cloudinaryUrl);
            results.totalProcessed++;
            console.log(`✅ [FeedImageProcessor] Uploaded to Cloudinary: ${cloudinaryUrl.substring(0, 80)}...`);
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          results.failedImages.push({
            originalUrl: imageUrl,
            error: error.message
          });
        }
      }

      // If no images processed successfully and fallback enabled
      if (results.processedImages.length === 0 && options.useUnsplashFallback) {
        const unsplashImages = await this.generateAndUploadUnsplashImages(vehicleData);
        results.processedImages = unsplashImages;
        results.unsplashUsed = true;
      }

    } catch (error) {
    }
    return results;
  }

  /**
   * Download image from ANY source and upload to Cloudinary
   * Handles: HTTP URLs, HTTPS URLs, Google Drive, Dropbox, Base64, Unsplash
   */
  async downloadAndUploadToCloudinary(imageUrl, vehicleData) {
    try {
      let downloadUrl = imageUrl;

      // Convert special URLs to direct download URLs
      if (imageUrl.includes('drive.google.com')) {
        downloadUrl = this.convertGoogleDriveUrl(imageUrl);
      } else if (imageUrl.includes('dropbox.com')) {
        downloadUrl = this.convertDropboxUrl(imageUrl);
      }

      // Handle base64 images
      if (imageUrl.startsWith('data:image/')) {
        return await this.uploadBase64ToCloudinary(imageUrl, vehicleData);
      }

      // Download image
      console.log(`⬇️  Downloading: ${downloadUrl.substring(0, 80)}...`);
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Check if it's actually an image
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Not an image: ${contentType}`);
      }

      // Convert to base64
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      const dataURI = `data:${contentType};base64,${base64Image}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: `carcatalog/feed-images/${vehicleData.stock_id || 'unknown'}`,
        quality: 'auto:good',
        fetch_format: 'auto',
        resource_type: 'image'
      });

      return uploadResult.secure_url;

    } catch (error) {
      return null;
    }
  }

  /**
   * Upload base64 image to Cloudinary
   */
  async uploadBase64ToCloudinary(base64Data, vehicleData) {
    try {
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: `carcatalog/feed-images/${vehicleData.stock_id || 'unknown'}`,
        quality: 'auto:good',
        fetch_format: 'auto'
      });
      return result.secure_url;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert Google Drive share URL to direct download URL
   */
  convertGoogleDriveUrl(driveUrl) {
    let fileId = null;

    // Extract file ID from various Drive URL formats
    if (driveUrl.includes('/file/d/')) {
      fileId = driveUrl.split('/file/d/')[1].split('/')[0];
    } else if (driveUrl.includes('id=')) {
      fileId = driveUrl.split('id=')[1].split('&')[0];
    } else if (driveUrl.includes('/d/')) {
      fileId = driveUrl.split('/d/')[1].split('/')[0];
    }

    if (fileId) {
      // Use export=view for images (more reliable than export=download)
      // This URL works for public images without authentication
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      console.log(`   Original: ${driveUrl.substring(0, 60)}...`);
      return directUrl;
    }
    return driveUrl;
  }

  /**
   * Convert Dropbox share URL to direct download URL
   */
  convertDropboxUrl(dropboxUrl) {
    let directUrl = dropboxUrl;

    if (dropboxUrl.includes('dropbox.com') && !dropboxUrl.includes('dl.dropboxusercontent.com')) {
      directUrl = dropboxUrl.replace('dropbox.com', 'dl.dropboxusercontent.com');
      if (directUrl.includes('?dl=0')) {
        directUrl = directUrl.replace('?dl=0', '?dl=1');
      }
    }

    return directUrl;
  }

  /**
   * Generate Unsplash placeholder images and upload to Cloudinary
   */
  async generateAndUploadUnsplashImages(vehicleData) {
    try {
      // Use real Unsplash photo URLs (not deprecated Source API)
      const unsplashPhotos = [
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80', // BMW
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', // Audi  
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80'  // Mercedes
      ];

      const cloudinaryUrls = [];

      // Download and upload each Unsplash image to Cloudinary
      for (const unsplashUrl of unsplashPhotos) {
        try {
          const cloudinaryUrl = await this.downloadAndUploadToCloudinary(unsplashUrl, vehicleData);
          if (cloudinaryUrl) {
            cloudinaryUrls.push(cloudinaryUrl);
          }
        } catch (error) {
        }
      }

      return cloudinaryUrls.length > 0 ? cloudinaryUrls : unsplashPhotos; // Fallback to originals if upload fails

    } catch (error) {
      // Return direct Unsplash URLs as last resort
      return [
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80'
      ];
    }
  }

  /**
   * Extract image URLs from vehicle data (flexible field mapping)
   */
  extractImageUrls(vehicleData) {
    const imageUrls = [];
    
    // Common image field names in feeds
    const imageFields = [
      'images', 'image', 'photos', 'photo', 'pictures', 'picture',
      'imageUrls', 'imageUrl', 'photoUrls', 'photoUrl',
      'img', 'imgs', 'pic', 'pics'
    ];

    for (const field of imageFields) {
      const value = vehicleData[field];

      if (Array.isArray(value)) {
        // Array of image URLs or objects
        value.forEach(item => {
          if (typeof item === 'string' && this.isValidImageUrl(item)) {
            imageUrls.push(item.trim());
          } else if (typeof item === 'object' && item !== null) {
            // Handle {url: "...", order: 0} format
            const url = item.url || item.sourceUrl || item.image || item.src;
            if (url && this.isValidImageUrl(url)) {
              imageUrls.push(url.trim());
            }
          }
        });
      } else if (typeof value === 'string' && value.trim()) {
        // Single image URL or comma-separated URLs
        if (value.includes(',')) {
          value.split(',').forEach(url => {
            if (this.isValidImageUrl(url)) {
              imageUrls.push(url.trim());
            }
          });
        } else if (this.isValidImageUrl(value)) {
          imageUrls.push(value.trim());
        }
      }
    }

    // Remove duplicates
    return [...new Set(imageUrls)];
  }

  /**
   * Validate if string is a valid image URL
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;

    const urlStr = url.trim().toLowerCase();

    // Check if it's a valid URL format
    if (!urlStr.match(/^(https?:\/\/|data:image\/|\/)/)) return false;

    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => urlStr.includes(ext));

    // Allow URLs without extensions if they contain image-related domains
    const imageDomains = ['unsplash.com', 'cloudinary.com', 'imgur.com', 'drive.google.com', 'dropbox', 'images.', 'photos.'];
    const hasImageDomain = imageDomains.some(domain => urlStr.includes(domain));

    // Allow data URLs
    const isDataUrl = urlStr.startsWith('data:image/');
    
    return hasImageExtension || hasImageDomain || isDataUrl;
  }
}

module.exports = new FeedImageProcessor();
