const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/upload/image - Upload single image
router.post('/image', uploadController.uploadImage);

// POST /api/upload/images - Upload multiple images
router.post('/images', uploadController.uploadMultipleImages);

// DELETE /api/upload/image/:publicId - Delete image
router.delete('/image/:publicId', uploadController.deleteImage);

module.exports = router;
