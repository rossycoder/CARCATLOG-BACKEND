const https = require('https');

const imageUrl = 'https://res.cloudinary.com/dexgkptpg/image/upload/v1770145415/car-adverts/3b315f99-6326-427d-b209-b98ac3920b80/f8jbg3jtpnczcmio6tlp.png';

console.log('🔍 Testing image URL:', imageUrl);

https.get(imageUrl, (res) => {
  console.log('📊 Response Status:', res.statusCode);
  console.log('📋 Response Headers:', res.headers);
  
  if (res.statusCode === 200) {
    console.log('✅ Image URL is accessible');
    console.log('📏 Content Length:', res.headers['content-length']);
    console.log('🎨 Content Type:', res.headers['content-type']);
  } else {
    console.log('❌ Image URL returned error status:', res.statusCode);
  }
  
  res.on('data', (chunk) => {
    // Just consume the data, don't log it
  });
  
  res.on('end', () => {
    console.log('✅ Request completed');
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('❌ Error accessing image URL:', err.message);
  process.exit(1);
});