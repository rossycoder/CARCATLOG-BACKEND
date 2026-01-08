/**
 * Upload logo to Cloudinary for use in emails
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadLogo() {
  try {
    console.log('📤 Uploading logo to Cloudinary...\n');

    const logoPath = path.join(__dirname, '../../frontend/public/images/brands/logo.jpeg');
    
    const result = await cloudinary.uploader.upload(logoPath, {
      folder: 'carcatalog',
      public_id: 'logo',
      overwrite: true,
      resource_type: 'image'
    });

    console.log('✅ Logo uploaded successfully!');
    console.log('\n📋 Logo URL:');
    console.log(result.secure_url);
    console.log('\n💡 Add this to your .env file:');
    console.log(`LOGO_URL=${result.secure_url}`);
    console.log('\nOr update your email templates to use this URL directly.');

  } catch (error) {
    console.error('❌ Error uploading logo:', error.message);
  }
}

uploadLogo();
