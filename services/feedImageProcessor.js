/**
 * Enhanced Feed Image Processor
 * Handles different image formats and sources from feeds
 */

const axios = require('axios');
const cloudinary = require('cloudinary').v2;

class FeedImageProcessor {

  /**
   * Process images from feed vehicle data
   * Supports: Direct URLs, Google Drive, Dropbox, Base64, Local paths
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
          const unsplashImages = await this.generateUnsplashImages(vehicleData);
          results.processedImages = unsplashImages;
          results.unsplashUsed = true;
          results.totalProcessed = unsplashImages.length;
        }
        return results;
      }

      // Process each image URL
      for (const imageUrl of imageUrls.slice(0, 10)) { // Limit to 10 images
        try {
          const processedUrl = await this.processImageUrl(imageUrl, options);
          if (processedUrl) {
            results.processedImages.push(processedUrl);
            results.totalProcessed++;
          }
        } catch (error) {
          console.error(`Failed to process image: ${imageUrl}`, error.message);
          results.failedImages.push({
            originalUrl: imageUrl,
            error: error.message
          });
        }
      }

      // If no images processed successfully and fallback enabled
      if (results.processedImages.length === 0 && options.useUnsplashFallback) {
        const unsplashImages = await this.generateUnsplashImages(vehicleData);
        results.processedImages = unsplashImages;
        results.unsplashUsed = true;
      }

    } catch (error) {
      console.error('Error processing vehicle images:', error);
    }

    return results;
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
        // Array of image URLs
        value.forEach(url => {
          if (this.isValidImageUrl(url)) {
            imageUrls.push(url.trim());
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
   * Process individual image URL based on its type
   */
  async processImageUrl(imageUrl, options = {}) {
    try {
      // Detect image source type
      const sourceType = this.detectImageSource(imageUrl);
      
      switch (sourceType) {
        case 'google_drive':
          return await this.processGoogleDriveImage(imageUrl);
          
        case 'dropbox':
          return await this.processDropboxImage(imageUrl);
          
        case 'base64':
          return await this.processBase64Image(imageUrl);
          
        case 'direct_url':
          return await this.processDirectUrl(imageUrl, options);
          
        case 'local_path':
          return await this.processLocalPath(imageUrl);
          
        default:
          // Try as direct URL
          return await this.processDirectUrl(imageUrl, options);
      }
      
    } catch (error) {
      console.error(`Failed to process image URL: ${imageUrl}`, error);
      return null;
    }
  }

  /**
   * Detect image source type
   */
  detectImageSource(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') return 'unknown';
    
    const url = imageUrl.toLowerCase();
    
    if (url.startsWith('data:image/')) return 'base64';
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'google_drive';
    if (url.includes('dropbox.com') || url.includes('dl.dropboxusercontent.com')) return 'dropbox';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'direct_url';
    if (url.startsWith('/') || url.includes('\\')) return 'local_path';
    
    return 'unknown';
  }

  /**
   * Process Google Drive image
   */
  async processGoogleDriveImage(driveUrl) {
    try {
      // Convert Google Drive share URL to direct image URL
      let fileId = null;
      
      if (driveUrl.includes('/file/d/')) {
        fileId = driveUrl.split('/file/d/')[1].split('/')[0];
      } else if (driveUrl.includes('id=')) {
        fileId = driveUrl.split('id=')[1].split('&')[0];
      }
      
      if (!fileId) {
        throw new Error('Could not extract Google Drive file ID');
      }
      
      // Convert to direct download URL
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // Validate the image
      const response = await axios.head(directUrl, { timeout: 5000 });
      if (response.status === 200) {
        return directUrl;
      }
      
      throw new Error('Google Drive image not accessible');
      
    } catch (error) {
      console.error('Google Drive image processing failed:', error.message);
      return null;
    }
  }

  /**
   * Process Dropbox image
   */
  async processDropboxImage(dropboxUrl) {
    try {
      // Convert Dropbox share URL to direct URL
      let directUrl = dropboxUrl;
      
      if (dropboxUrl.includes('dropbox.com') && !dropboxUrl.includes('dl.dropboxusercontent.com')) {
        // Convert share URL to direct URL
        directUrl = dropboxUrl.replace('dropbox.com', 'dl.dropboxusercontent.com');
        if (directUrl.includes('?dl=0')) {
          directUrl = directUrl.replace('?dl=0', '?dl=1');
        }
      }
      
      // Validate the image
      const response = await axios.head(directUrl, { timeout: 5000 });
      if (response.status === 200) {
        return directUrl;
      }
      
      throw new Error('Dropbox image not accessible');
      
    } catch (error) {
      console.error('Dropbox image processing failed:', error.message);
      return null;
    }
  }

  /**
   * Process Base64 image
   */
  async processBase64Image(base64Data) {
    try {
      // Upload base64 to Cloudinary
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: 'feed-images',
        quality: 'auto',
        format: 'jpg'
      });
      
      return result.secure_url;
      
    } catch (error) {
      console.error('Base64 image processing failed:', error.message);
      return null;
    }
  }

  /**
   * Process direct URL
   */
  async processDirectUrl(imageUrl, options = {}) {
    try {
      // Validate image URL
      const response = await axios.head(imageUrl, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.status === 200) {
        const contentType = response.headers['content-type'];
        if (contentType && contentType.startsWith('image/')) {
          
          // If upload to Cloudinary enabled, upload and return Cloudinary URL
          if (options.uploadToCloudinary) {
            const result = await cloudinary.uploader.upload(imageUrl, {
              folder: 'feed-images',
              quality: 'auto',
              format: 'jpg'
            });
            return result.secure_url;
          }
          
          return imageUrl;
        }
      }
      
      throw new Error('URL does not point to a valid image');
      
    } catch (error) {
      console.error('Direct URL processing failed:', error.message);
      return null;
    }
  }

  /**
   * Process local file path (convert to accessible URL)
   */
  async processLocalPath(localPath) {
    try {
      // For local paths, we can't directly access them
      // Return null to indicate this image couldn't be processed
      console.warn(`Local path detected, cannot process: ${localPath}`);
      return null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate Unsplash images as fallback
   */
  async generateUnsplashImages(vehicleData) {
    try {
      const make = vehicleData.make || 'car';
      const model = vehicleData.model || '';
      const year = vehicleData.year || '';
      
      // Generate search queries
      const queries = [
        `${make} ${model} ${year}`,
        `${make} ${model}`,
        `${make} car`,
        'car showroom',
        'luxury car'
      ].filter(q => q.trim());

      const images = [];
      
      for (let i = 0; i < Math.min(3, queries.length); i++) {
        const query = queries[i].replace(/\s+/g, '+');
        const unsplashUrl = `https://source.unsplash.com/800x600/?${query}`;
        images.push(unsplashUrl);
      }
      
      return images;
      
    } catch (error) {
      console.error('Unsplash image generation failed:', error.message);
      return [
        'https://source.unsplash.com/800x600/?car',
        'https://source.unsplash.com/800x600/?automobile',
        'https://source.unsplash.com/800x600/?vehicle'
      ];
    }
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
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const hasImageExtension = imageExtensions.some(ext => urlStr.includes(ext));
    
    // Allow URLs without extensions if they contain image-related domains
    const imageDomains = ['unsplash.com', 'cloudinary.com', 'imgur.com', 'drive.google.com', 'dropbox'];
    const hasImageDomain = imageDomains.some(domain => urlStr.includes(domain));
    
    // Allow data URLs
    const isDataUrl = urlStr.startsWith('data:image/');
    
    return hasImageExtension || hasImageDomain || isDataUrl;
  }
}

module.exports = new FeedImageProcessor();