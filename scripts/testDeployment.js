/**
 * Deployment Test Script
 * Tests critical functionality after deployment
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

async function testDeployment() {
  console.log('\n🚀 Testing Deployment Configuration\n');
  
  let allPassed = true;
  
  // Test 1: Environment Variables
  log.info('Test 1: Checking Environment Variables');
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'FRONTEND_URL',
    'STRIPE_SECRET_KEY',
    'CLOUDINARY_CLOUD_NAME'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log.success(`${envVar} is set`);
    } else {
      log.error(`${envVar} is missing`);
      allPassed = false;
    }
  }
  
  // Test 2: MongoDB Connection
  log.info('\nTest 2: Testing MongoDB Connection');
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (mongoUri.includes('localhost')) {
      log.warning('Using localhost MongoDB - this will fail in production!');
      log.warning('Update MONGODB_URI to use MongoDB Atlas');
      allPassed = false;
    } else {
      log.success('Using cloud MongoDB (Atlas)');
    }
    
    await mongoose.connect(mongoUri);
    log.success('MongoDB connection successful');
    log.info(`Connected to: ${mongoose.connection.host}`);
    log.info(`Database: ${mongoose.connection.name}`);
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    log.success(`Found ${collections.length} collections`);
    
    await mongoose.connection.close();
    log.success('MongoDB connection closed');
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    allPassed = false;
  }
  
  // Test 3: API Keys
  log.info('\nTest 3: Checking API Keys');
  const apiKeys = {
    'DVLA API': process.env.DVLA_API_KEY,
    'CheckCardDetails API': process.env.CHECKCARD_API_KEY,
    'Stripe': process.env.STRIPE_SECRET_KEY,
    'Cloudinary': process.env.CLOUDINARY_API_KEY
  };
  
  for (const [name, key] of Object.entries(apiKeys)) {
    if (key) {
      log.success(`${name} key is configured`);
    } else {
      log.warning(`${name} key is missing`);
    }
  }
  
  // Test 4: Environment Mode
  log.info('\nTest 4: Checking Environment Mode');
  const nodeEnv = process.env.NODE_ENV || 'development';
  log.info(`NODE_ENV: ${nodeEnv}`);
  
  if (nodeEnv === 'production') {
    log.success('Running in production mode');
    
    // Check if using production Stripe keys
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
      log.success('Using live Stripe keys');
    } else if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      log.warning('Using test Stripe keys in production');
    }
  } else {
    log.info('Running in development mode');
  }
  
  // Test 5: CORS Configuration
  log.info('\nTest 5: Checking CORS Configuration');
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    log.success(`Frontend URL: ${frontendUrl}`);
    if (frontendUrl.includes('localhost')) {
      log.warning('Frontend URL is localhost - update for production');
    }
  } else {
    log.error('FRONTEND_URL not set');
    allPassed = false;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    log.success('All critical tests passed! ✨');
    log.info('Your deployment should work correctly');
  } else {
    log.error('Some tests failed!');
    log.warning('Fix the issues above before deploying');
  }
  console.log('='.repeat(50) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
testDeployment().catch(error => {
  log.error(`Test script failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
