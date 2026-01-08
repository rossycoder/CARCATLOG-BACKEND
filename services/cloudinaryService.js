const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('[Cloudinary] Configuring with cloud_name:', cloudName);
console.log('[Cloudinary] API Key present:', !!apiKey);
console.log('[Cloudinary] API Secret present:', !!apiSecret);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

/**
 * Upload image to Cloudinary
 * @param {string} imageData - Base64 encoded image data or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (imageData, options = {}) => {
  try {
    const uploadOptions = {
      folder: options.folder || 'car-adverts',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(imageData, uploadOptions);
    
    return {
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} images - Array of base64 encoded images
 * @param {string} advertId - Advert ID for folder organization
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleImages = async (images, advertId) => {
  const results = [];
  
  for (let i = 0; i < images.length; i++) {
    const result = await uploadImage(images[i], {
      folder: `car-adverts/${advertId}`,
      public_id: `image_${i + 1}_${Date.now()}`
    });
    results.push(result);
  }
  
  return results;
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      data: result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: options.width || 800, height: options.height || 600, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getOptimizedUrl,
  cloudinary
};
