/**
 * Enhanced Feed Image Downloader
 * Supports: HTTP/HTTPS, Google Drive, Unsplash, Dropbox, S3, and other formats
 * Downloads images → validates → uploads to Cloudinary → saves to DB
 */

const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const FeedImage = require('../models/FeedImage');
const Car = require('../models/Car');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─── URL Type Detector ──────────────────────────────────────────────────────

/**
 * Detects the source type and converts any URL to a direct downloadable URL
 * @param {string} url - Original URL from feed
 * @returns {{ type: string, downloadUrl: string, requiresAuth: boolean }}
 */
function detectAndNormalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return { type: 'invalid', downloadUrl: null, requiresAuth: false };
  }

  const trimmed = url.trim();

  // ── Google Drive ──────────────────────────────────────────────────────────
  // Formats:
  //   https://drive.google.com/file/d/FILE_ID/view
  //   https://drive.google.com/open?id=FILE_ID
  //   https://drive.google.com/uc?id=FILE_ID
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?\s]+)/);
  const driveOpenMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([^&\s]+)/);

  if (driveFileMatch || driveOpenMatch) {
    const fileId = (driveFileMatch || driveOpenMatch)[1];
    return {
      type: 'google_drive',
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      requiresAuth: false,
      fileId
    };
  }

  // ── Unsplash ──────────────────────────────────────────────────────────────
  // Formats:
  //   https://images.unsplash.com/photo-xxx?...
  //   https://unsplash.com/photos/xxx
  //   https://source.unsplash.com/800x600/?cars
  if (trimmed.includes('unsplash.com')) {
    // source.unsplash.com — random image, just use as-is
    if (trimmed.includes('source.unsplash.com')) {
      return {
        type: 'unsplash',
        downloadUrl: trimmed,
        requiresAuth: false
      };
    }

    // images.unsplash.com — already direct, ensure we get a reasonable size
    if (trimmed.includes('images.unsplash.com')) {
      // Remove small size params and force a good quality
      const cleanUrl = trimmed
        .replace(/[?&]w=\d+/, '')
        .replace(/[?&]h=\d+/, '')
        .replace(/[?&]q=\d+/, '');
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return {
        type: 'unsplash',
        downloadUrl: `${cleanUrl}${separator}w=1200&q=85&fm=jpg`,
        requiresAuth: false
      };
    }

    // unsplash.com/photos/ID — need API or redirect
    const photoMatch = trimmed.match(/unsplash\.com\/photos\/([^?/\s]+)/);
    if (photoMatch) {
      // Use Unsplash's download trigger if API key available
      if (process.env.UNSPLASH_ACCESS_KEY) {
        return {
          type: 'unsplash_api',
          downloadUrl: trimmed, // handled separately with API
          requiresAuth: true,
          photoId: photoMatch[1]
        };
      }
      // Fallback to source.unsplash.com
      return {
        type: 'unsplash',
        downloadUrl: `https://source.unsplash.com/${photoMatch[1]}/1200x900`,
        requiresAuth: false
      };
    }
  }

  // ── Dropbox ───────────────────────────────────────────────────────────────
  // https://www.dropbox.com/s/FILE_ID/name.jpg?dl=0  →  ?dl=1
  if (trimmed.includes('dropbox.com')) {
    const directUrl = trimmed
      .replace('?dl=0', '?dl=1')
      .replace('?raw=0', '?raw=1')
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace(/[?&]dl=0/, '?dl=1');

    // If no dl param, add it
    const finalUrl = directUrl.includes('dl=1') ? directUrl : `${directUrl}?dl=1`;

    return {
      type: 'dropbox',
      downloadUrl: finalUrl,
      requiresAuth: false
    };
  }

  // ── Amazon S3 / CloudFront ─────────────────────────────────────────────────
  if (
    trimmed.includes('s3.amazonaws.com') ||
    trimmed.includes('s3-') ||
    trimmed.includes('.cloudfront.net')
  ) {
    return {
      type: 's3',
      downloadUrl: trimmed,
      requiresAuth: false
    };
  }

  // ── Azure Blob Storage ────────────────────────────────────────────────────
  if (trimmed.includes('.blob.core.windows.net')) {
    return {
      type: 'azure_blob',
      downloadUrl: trimmed,
      requiresAuth: false
    };
  }

  // ── Cloudinary (already uploaded) ─────────────────────────────────────────
  if (trimmed.includes('cloudinary.com') || trimmed.includes('res.cloudinary.com')) {
    return {
      type: 'cloudinary',
      downloadUrl: trimmed,
      requiresAuth: false,
      alreadyOnCloudinary: true
    };
  }

  // ── Generic HTTP/HTTPS ────────────────────────────────────────────────────
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      type: 'http',
      downloadUrl: trimmed,
      requiresAuth: false
    };
  }

  return { type: 'unknown', downloadUrl: null, requiresAuth: false };
}

// ─── Downloader ──────────────────────────────────────────────────────────────

/**
 * Download image bytes from any supported URL
 * @param {string} originalUrl
 * @returns {{ buffer: Buffer, contentType: string, sourceType: string } | null}
 */
async function downloadImage(originalUrl) {
  const { type, downloadUrl, requiresAuth, alreadyOnCloudinary, photoId } = detectAndNormalizeUrl(originalUrl);

  if (!downloadUrl) {
    throw new Error(`Cannot determine download URL for: ${originalUrl}`);
  }

  // Already on Cloudinary — just return the URL as-is, no need to re-upload
  if (alreadyOnCloudinary) {
    return { alreadyOnCloudinary: true, cloudinaryUrl: downloadUrl, sourceType: type };
  }

  // Unsplash with API key — hit the download endpoint for attribution
  if (type === 'unsplash_api' && process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const apiResp = await axios.get(
        `https://api.unsplash.com/photos/${photoId}/download`,
        {
          headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
          timeout: 10000
        }
      );
      const directUrl = apiResp.data?.url;
      if (directUrl) {
        return await downloadFromUrl(directUrl, type);
      }
    } catch (err) {
      console.warn(`[ImageDownloader] Unsplash API failed, trying direct URL: ${err.message}`);
    }
  }

  return await downloadFromUrl(downloadUrl, type);
}

/**
 * Actually download bytes from a URL with retries
 */
async function downloadFromUrl(url, sourceType, retries = 3) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; CarCatalog FeedBot/1.0)',
    'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8'
  };

  // Google Drive needs a different approach for large files (bypass virus scan)
  if (sourceType === 'google_drive') {
    return await downloadGoogleDriveImage(url, headers);
  }

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 45000,
        maxContentLength: 15 * 1024 * 1024, // 15MB max
        headers,
        maxRedirects: 10, // Follow redirects (Dropbox, Drive etc redirect)
        validateStatus: status => status < 400
      });

      const contentType = response.headers['content-type'] || '';

      // Validate it's an image
      if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
        // Some servers return wrong content type — sniff the magic bytes
        const buffer = Buffer.from(response.data, 'binary');
        const detectedType = sniffImageType(buffer);
        if (!detectedType) {
          throw new Error(`Not an image. Content-Type: ${contentType}`);
        }
        return { buffer, contentType: detectedType, sourceType };
      }

      return {
        buffer: Buffer.from(response.data, 'binary'),
        contentType: contentType.split(';')[0].trim(),
        sourceType
      };

    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = attempt * 1500; // 1.5s, 3s backoff
        console.warn(`[ImageDownloader] Attempt ${attempt} failed for ${url}: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Google Drive large file download (handles virus scan warning page)
 */
async function downloadGoogleDriveImage(url, headers) {
  // First request — may get HTML virus warning page or redirect
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 45000,
    maxContentLength: 15 * 1024 * 1024,
    headers,
    maxRedirects: 5
  });

  const contentType = response.headers['content-type'] || '';

  // If we got HTML — likely virus scan confirmation page
  if (contentType.includes('text/html')) {
    const html = Buffer.from(response.data).toString('utf8');

    // Extract confirmation token from the page
    const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/);
    const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);

    if (confirmMatch) {
      // Re-request with confirmation
      const fileIdMatch = url.match(/id=([^&]+)/);
      if (fileIdMatch) {
        const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}&confirm=${confirmMatch[1]}${uuidMatch ? `&uuid=${uuidMatch[1]}` : ''}`;
        const confirmed = await axios.get(confirmUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
          maxContentLength: 15 * 1024 * 1024,
          headers,
          maxRedirects: 10
        });
        return {
          buffer: Buffer.from(confirmed.data, 'binary'),
          contentType: confirmed.headers['content-type']?.split(';')[0].trim() || 'image/jpeg',
          sourceType: 'google_drive'
        };
      }
    }

    throw new Error('Google Drive returned HTML page — file may be private or require login');
  }

  return {
    buffer: Buffer.from(response.data, 'binary'),
    contentType: contentType.split(';')[0].trim(),
    sourceType: 'google_drive'
  };
}

/**
 * Detect image type from magic bytes (first few bytes of file)
 */
function sniffImageType(buffer) {
  if (!buffer || buffer.length < 4) return null;

  const hex = buffer.slice(0, 4).toString('hex');

  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  if (hex.startsWith('89504e47')) return 'image/png';
  if (hex.startsWith('47494638')) return 'image/gif';
  if (hex.startsWith('52494646')) return 'image/webp'; // RIFF....WEBP
  if (hex.startsWith('49492a00') || hex.startsWith('4d4d002a')) return 'image/tiff';

  return null;
}

// ─── Cloudinary Uploader ─────────────────────────────────────────────────────

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {string} contentType
 * @param {string} carId
 * @param {number} imageOrder
 * @param {string} sourceType
 * @returns {Promise<string>} Cloudinary secure_url
 */
async function uploadToCloudinary(buffer, contentType, carId, imageOrder = 0, sourceType = 'http') {
  const base64 = buffer.toString('base64');
  const dataUri = `data:${contentType};base64,${base64}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: `carcatalog/feed-vehicles/${carId}`,
    public_id: `img_${imageOrder}_${sourceType}`,
    overwrite: true,
    resource_type: 'image',
    quality: 'auto:good',
    fetch_format: 'auto',
    transformation: [
      { width: 1200, height: 900, crop: 'limit' } // Cap max size, preserve aspect ratio
    ]
  });

  return uploadResult.secure_url;
}

// ─── Main Service ────────────────────────────────────────────────────────────

class FeedImageService {

  /**
   * Process all pending images for a vehicle
   * @param {string} feedVehicleId
   * @param {string} carId
   * @returns {Promise<{ success: number, failed: number, skipped: number, urls: string[] }>}
   */
  async processVehicleImages(feedVehicleId, carId) {
    const feedImages = await FeedImage.find({
      feedVehicleId,
      downloadStatus: { $in: ['pending', 'failed'] }
    }).sort({ imageOrder: 1 });

    if (feedImages.length === 0) {
      console.log(`[ImageDownloader] No pending images for vehicle ${feedVehicleId}`);
      return { success: 0, failed: 0, skipped: 0, urls: [] };
    }

    console.log(`[ImageDownloader] Processing ${feedImages.length} images for vehicle ${feedVehicleId}`);

    const uploadedUrls = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const feedImage of feedImages) {
      try {
        const url = await this.processSingleImage(feedImage, carId);

        if (url) {
          uploadedUrls.push(url);
          successCount++;

          await FeedImage.findByIdAndUpdate(feedImage._id, {
            downloadStatus: 'completed',
            cloudinaryUrl: url,
            downloadedAt: new Date(),
            errorMessage: null
          });
        }
      } catch (error) {
        failedCount++;
        console.error(`[ImageDownloader] Failed image ${feedImage.sourceUrl}: ${error.message}`);

        await FeedImage.findByIdAndUpdate(feedImage._id, {
          downloadStatus: 'failed',
          errorMessage: error.message,
          failedAt: new Date()
        });
      }
    }

    // Update Car with all successfully uploaded image URLs
    if (uploadedUrls.length > 0) {
      await Car.findByIdAndUpdate(carId, {
        $addToSet: { images: { $each: uploadedUrls } } // Add without duplicates
      });
      console.log(`[ImageDownloader] ✅ Updated car ${carId} with ${uploadedUrls.length} images`);
    }

    return {
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
      urls: uploadedUrls
    };
  }

  /**
   * Process a single FeedImage record
   */
  async processSingleImage(feedImage, carId) {
    const sourceUrl = feedImage.sourceUrl;

    console.log(`[ImageDownloader] Processing: ${sourceUrl}`);

    const urlInfo = detectAndNormalizeUrl(sourceUrl);
    console.log(`[ImageDownloader] Detected type: ${urlInfo.type}`);

    // Already on Cloudinary — no need to re-upload, just return the URL
    if (urlInfo.alreadyOnCloudinary) {
      console.log(`[ImageDownloader] Already on Cloudinary, skipping upload`);
      return urlInfo.cloudinaryUrl;
    }

    if (urlInfo.type === 'invalid' || urlInfo.type === 'unknown') {
      throw new Error(`Unsupported URL format: ${sourceUrl}`);
    }

    // Download the image
    const downloaded = await downloadImage(sourceUrl);

    if (downloaded.alreadyOnCloudinary) {
      return downloaded.cloudinaryUrl;
    }

    // Validate size
    if (downloaded.buffer.length < 1000) {
      throw new Error(`Image too small (${downloaded.buffer.length} bytes) — likely a broken image`);
    }

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(
      downloaded.buffer,
      downloaded.contentType,
      carId,
      feedImage.imageOrder,
      downloaded.sourceType
    );

    console.log(`[ImageDownloader] ✅ Uploaded (${urlInfo.type}): ${cloudinaryUrl}`);
    return cloudinaryUrl;
  }

  /**
   * Process images directly from URL list (no FeedImage records needed)
   * Useful for quick imports where you just have a list of URLs
   * @param {string[]} imageUrls
   * @param {string} carId
   * @returns {Promise<string[]>} Array of Cloudinary URLs
   */
  async processImageUrls(imageUrls, carId) {
    if (!imageUrls || imageUrls.length === 0) return [];

    const results = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = typeof imageUrls[i] === 'string' ? imageUrls[i] : imageUrls[i]?.url;
      if (!url) continue;

      try {
        const urlInfo = detectAndNormalizeUrl(url);

        if (urlInfo.alreadyOnCloudinary) {
          results.push(url);
          continue;
        }

        if (urlInfo.type === 'invalid' || urlInfo.type === 'unknown') {
          console.warn(`[ImageDownloader] Skipping unsupported URL: ${url}`);
          continue;
        }

        const downloaded = await downloadImage(url);

        if (downloaded.alreadyOnCloudinary) {
          results.push(downloaded.cloudinaryUrl);
          continue;
        }

        const cloudinaryUrl = await uploadToCloudinary(
          downloaded.buffer,
          downloaded.contentType,
          carId,
          i,
          downloaded.sourceType
        );

        results.push(cloudinaryUrl);
        console.log(`[ImageDownloader] ✅ ${i + 1}/${imageUrls.length}: ${cloudinaryUrl}`);

      } catch (error) {
        console.error(`[ImageDownloader] ❌ Failed URL ${url}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Retry all failed images for a vehicle
   */
  async retryFailedImages(feedVehicleId, carId) {
    await FeedImage.updateMany(
      { feedVehicleId, downloadStatus: 'failed' },
      { $set: { downloadStatus: 'pending', errorMessage: null } }
    );
    return await this.processVehicleImages(feedVehicleId, carId);
  }

  /**
   * Get image processing stats for a feed
   */
  async getImageStats(feedId) {
    const stats = await FeedImage.aggregate([
      {
        $lookup: {
          from: 'feedvehicles',
          localField: 'feedVehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $match: { 'vehicle.feedId': feedId } },
      { $group: { _id: '$downloadStatus', count: { $sum: 1 } } }
    ]);

    const result = { total: 0, pending: 0, completed: 0, failed: 0 };
    stats.forEach(s => {
      result[s._id] = s.count;
      result.total += s.count;
    });
    return result;
  }

  /**
   * Delete vehicle images from Cloudinary and DB
   */
  async deleteVehicleImages(carId) {
    try {
      const folderPath = `carcatalog/feed-vehicles/${carId}`;
      await cloudinary.api.delete_resources_by_prefix(folderPath);
      await cloudinary.api.delete_folder(folderPath);
      console.log(`[ImageDownloader] Deleted Cloudinary folder: ${folderPath}`);
    } catch (error) {
      console.error('[ImageDownloader] Error deleting images:', error.message);
    }
  }

  /**
   * Expose URL detector for testing / debugging
   */
  detectUrlType(url) {
    return detectAndNormalizeUrl(url);
  }
}

module.exports = new FeedImageService();