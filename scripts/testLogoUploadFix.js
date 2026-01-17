require('dotenv').config();
const cloudinary = require('../services/cloudinaryService');
const fs = require('fs');
const path = require('path');

async function testLogoUpload() {
  try {
    console.log('Testing logo upload to Cloudinary...\n');

    // Create a simple test buffer (simulating multer's req.file.buffer)
    // In a real scenario, this would be an actual image file
    const testImagePath = path.join(__dirname, '../../public/images/brands/placeholder-logo.svg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('Test image not found, creating a minimal test...');
      // Create a minimal 1x1 PNG buffer for testing
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);
      
      const base64Image = `data:image/png;base64,${minimalPNG.toString('base64')}`;
      
      console.log('Uploading test image...');
      const result = await cloudinary.uploadImage(base64Image, {
        folder: 'dealer-logos',
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      
      console.log('\n=== Upload Result ===');
      console.log('Success:', result.success);
      if (result.success) {
        console.log('URL:', result.data.url);
        console.log('Public ID:', result.data.publicId);
        console.log('Format:', result.data.format);
        console.log('Size:', result.data.bytes, 'bytes');
      } else {
        console.log('Error:', result.error);
      }
      
      return;
    }

    // Read the test image
    const imageBuffer = fs.readFileSync(testImagePath);
    const mimetype = 'image/svg+xml';
    
    // Convert buffer to base64 data URI (same as in the fixed controller)
    const base64Image = `data:${mimetype};base64,${imageBuffer.toString('base64')}`;
    
    console.log('Buffer size:', imageBuffer.length, 'bytes');
    console.log('Base64 prefix:', base64Image.substring(0, 50) + '...\n');
    
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploadImage(base64Image, {
      folder: 'dealer-logos',
      transformation: [
        { width: 400, height: 400, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    console.log('\n=== Upload Result ===');
    console.log('Success:', result.success);
    if (result.success) {
      console.log('URL:', result.data.url);
      console.log('Public ID:', result.data.publicId);
      console.log('Format:', result.data.format);
      console.log('Size:', result.data.bytes, 'bytes');
      console.log('\n✅ Logo upload is working correctly!');
    } else {
      console.log('Error:', result.error);
      console.log('\n❌ Logo upload failed');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testLogoUpload();
