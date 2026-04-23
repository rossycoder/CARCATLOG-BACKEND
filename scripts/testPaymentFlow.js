/**
 * Test Payment Flow Script
 * Tests the complete payment flow from session creation to webhook processing
 * 
 * Usage: node scripts/testPaymentFlow.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const StripeService = require('../services/stripeService');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

// Test data
const testPackage = {
  packageId: 'silver',
  packageName: 'Silver',
  price: 1399, // £13.99 in pence
  duration: '6 weeks',
  sellerType: 'private',
  vehicleValue: '1000-2999',
  registration: 'TEST123',
  mileage: '50000',
  advertId: 'test-advert-' + Date.now()
};

async function testPaymentFlow() {
  try {
    console.log('🧪 Starting Payment Flow Test\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    console.log('\n📊 Step 1: Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carcatalog');
    console.log('✅ Database connected');
    
    // Check Stripe configuration
    console.log('\n🔑 Step 2: Checking Stripe configuration...');
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('❌ STRIPE_SECRET_KEY not found in environment');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn('⚠️  STRIPE_WEBHOOK_SECRET not found - webhooks may not work');
    }
    
    const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    console.log(`✅ Stripe configured in ${isTestMode ? 'TEST' : 'LIVE'} mode`);
    if (!isTestMode) {
      console.error('❌ WARNING: Using LIVE Stripe keys! This will charge real money!');
      process.exit(1);
    }
    
    // Create Stripe service
    console.log('\n💳 Step 3: Creating Stripe checkout session...');
    const stripeService = new StripeService();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const session = await stripeService.createAdvertCheckoutSession(
      testPackage.packageId,
      testPackage.packageName,
      testPackage.price,
      testPackage.duration,
      testPackage.sellerType,
      testPackage.vehicleValue,
      testPackage.registration,
      testPackage.mileage,
      testPackage.advertId,
      { price: 2500, description: 'Test car', photos: [] },
      { make: 'Test', model: 'Car', year: 2020 },
      { email: 'test@example.com', phoneNumber: '07700900000' },
      `${baseUrl}/sell-my-car/advert-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/sell-my-car/advertising-prices?cancelled=true`
    );
    
    console.log('✅ Checkout session created:');
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   Custom ID: ${session.customSessionId}`);
    console.log(`   Amount: £${(session.amount / 100).toFixed(2)}`);
    console.log(`   URL: ${session.url}`);
    
    // Create purchase record
    console.log('\n📝 Step 4: Creating purchase record...');
    const purchase = new AdvertisingPackagePurchase({
      stripeSessionId: session.sessionId,
      customSessionId: session.customSessionId,
      packageId: testPackage.packageId,
      packageName: testPackage.packageName,
      duration: testPackage.duration,
      amount: testPackage.price,
      currency: 'gbp',
      sellerType: testPackage.sellerType,
      vehicleValue: testPackage.vehicleValue,
      registration: testPackage.registration,
      mileage: testPackage.mileage,
      paymentStatus: 'pending',
      packageStatus: 'pending',
      metadata: {
        advertId: testPackage.advertId,
        advertData: JSON.stringify({ price: 2500 }),
        vehicleData: JSON.stringify({ make: 'Test', model: 'Car' }),
        contactDetails: JSON.stringify({ email: 'test@example.com' })
      }
    });
    
    await purchase.save();
    console.log('✅ Purchase record created:');
    console.log(`   Purchase ID: ${purchase._id}`);
    console.log(`   Status: ${purchase.paymentStatus}`);
    
    // Check if session can be retrieved
    console.log('\n🔍 Step 5: Verifying session retrieval...');
    const retrievedSession = await stripeService.getCheckoutSession(session.sessionId);
    console.log('✅ Session retrieved successfully:');
    console.log(`   Payment Status: ${retrievedSession.payment_status}`);
    console.log(`   Status: ${retrievedSession.status}`);
    
    // Instructions for manual testing
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 MANUAL TESTING INSTRUCTIONS:\n');
    console.log('1. Open this URL in your browser:');
    console.log(`   ${session.url}\n`);
    console.log('2. Use Stripe test card for SUCCESS:');
    console.log('   Card: 4242 4242 4242 4242');
    console.log('   Expiry: Any future date (e.g., 12/34)');
    console.log('   CVC: Any 3 digits (e.g., 123)');
    console.log('   ZIP: Any 5 digits (e.g., 12345)\n');
    console.log('3. Complete the payment\n');
    console.log('4. Check webhook processing:');
    console.log('   - Go to Stripe Dashboard > Developers > Webhooks');
    console.log('   - Check for events related to this session');
    console.log('   - Verify webhook endpoint is configured\n');
    console.log('5. Check purchase status:');
    console.log(`   node scripts/checkPurchaseStatus.js ${purchase._id}\n`);
    
    console.log('='.repeat(60));
    console.log('\n🧪 Test setup complete! Follow the instructions above.\n');
    
    // Keep connection open for a bit
    console.log('⏳ Keeping connection open for 60 seconds...');
    console.log('   (Press Ctrl+C to exit early)\n');
    
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testPaymentFlow();
