/**
 * Simple test to check if API key is loaded
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

console.log('Environment Variables Check:');
console.log('============================');
console.log('CHECKCARD_API_KEY:', process.env.CHECKCARD_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('API_ENVIRONMENT:', process.env.API_ENVIRONMENT);
console.log('CHECKCARD_API_BASE_URL:', process.env.CHECKCARD_API_BASE_URL);

if (process.env.CHECKCARD_API_KEY) {
  console.log('\n✅ API Key is configured!');
  console.log('Key preview:', process.env.CHECKCARD_API_KEY.substring(0, 8) + '...');
} else {
  console.log('\n❌ API Key is NOT configured!');
  console.log('Please check your .env file');
}
