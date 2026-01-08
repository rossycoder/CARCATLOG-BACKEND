const cloudinaryService = require('../services/cloudinaryService');

/**
 * Upload single image to Cloudinary
 * POST /api/upload/image
 */
const uploadImage = async (req, res) => {
  try {
    const { image, advertId } = req.body;
    
    console.log('[Upload] Received upload request, advertId:', advertId);
    console.log('[Upload] Image data length:', image ? image.length : 0);
    
    if (!image) {
      console.log('[Upload] Error: No image data provided');
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }
    
    console.log('[Upload] Uploading to Cloudinary...');
    const result = await cloudinaryService.uploadImage(image, {
      folder: advertId ? `car-adverts/${advertId}` : 'car-adverts'
    });
    
    console.log('[Upload] Cloudinary result:', result.success ? 'Success' : 'Failed', result.error || '');
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[Upload] Error:', error.message);
    console.error('[Upload] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

/**
 * Upload multiple images to Cloudinary
 * POST /api/upload/images
 */
const uploadMultipleImages = async (req, res) => {
  try {
    const { images, advertId } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Images array is required'
      });
    }
    
    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 images allowed per upload'
      });
    }
    
    const results = await cloudinaryService.uploadMultipleImages(images, advertId);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    res.json({
      success: true,
      data: {
        uploaded: successful.map(r => r.data),
        failed: failed.length,
        total: images.length
      }
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

/**
 * Delete image from Cloudinary
 * DELETE /api/upload/image/:publicId
 */
const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }
    
    // Decode the public ID (it may be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await cloudinaryService.deleteImage(decodedPublicId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage
};
