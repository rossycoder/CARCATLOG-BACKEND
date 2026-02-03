require('dotenv').config();

console.log('🔍 Testing Environment Variables');
console.log('='.repeat(40));

console.log('CHECKCARD_API_KEY:', process.env.CHECKCARD_API_KEY ? `${process.env.CHECKCARD_API_KEY.substring(0, 8)}...` : 'NOT SET');
console.log('CHECKCARD_API_BASE_URL:', process.env.CHECKCARD_API_BASE_URL || 'NOT SET');
console.log('API_ENVIRONMENT:', process.env.API_ENVIRONMENT || 'NOT SET');

console.log('\n🔍 Full API Key Length:', process.env.CHECKCARD_API_KEY ? process.env.CHECKCARD_API_KEY.length : 0);

if (process.env.CHECKCARD_API_KEY) {
  console.log('✅ API Key is loaded');
} else {
  console.log('❌ API Key is missing');
}