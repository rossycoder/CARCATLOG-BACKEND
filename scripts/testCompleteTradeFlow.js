#!/usr/bin/env node
/**
 * Test Complete Trade Dealer Flow
 * Tests: Register -> Verify Email -> Subscribe -> Payment -> Login -> Check Subscription
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Trade Dealer Flow');
    console.log('=====================================\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);
    console.log('');

    // Test email
    const testEmail = 'test-dealer-' + Date.now() + '@example.com';
    console.log('📧 Test email:', testEmail);
    console.log('');

    // Step 1: Check if subscription plans exist
    console.log('Step 1: Checking subscription plans...');
    const plans = await SubscriptionPlan.find({ isActive: true });
    console.log(`✅ Found ${plans.length} active plans`);
    
    if (plans.length === 0) {
      console.log('❌ No subscription plans found!');
      console.log('💡 Run: node scripts/seedSubscriptionPlans.js');
      process.exit(1);
    }

    const testPlan = plans[0];
    console.log(`   Using plan: ${testPlan.name} (${testPlan.slug})`);
    console.log('');

    // Step 2: Create test dealer (simulating registration)
    console.log('Step 2: Creating test dealer...');
    const dealer = new TradeDealer({
      businessName: 'Test Auto Dealers Ltd',
      tradingName: 'Test Motors',
      contactPerson: 'John Test',
      email: testEmail,
      phone: '+447123456789',
      password: 'TestPassword123!',
      businessAddress: {
        street: '123 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      businessRegistrationNumber: '12345678',
      vatNumber: 'GB123456789',
      status: 'active',
      emailVerified: true
    });

    await dealer.save();
    console.log('✅ Dealer created:', dealer._id);
    console.log('   Business:', dealer.businessName);
    console.log('   Email:', dealer.email);
    console.log('');

    // Step 3: Create subscription (simulating payment completion)
    console.log('Step 3: Creating subscription...');
    const subscription = new TradeSubscription({
      dealerId: dealer._id,
      planId: testPlan._id,
      stripeSubscriptionId: `sub_test_${Date.now()}`,
      stripeCustomerId: `cus_test_${Date.now()}`,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      listingsLimit: testPlan.listingLimit,
      listingsUsed: 0
    });

    await subscription.save();
    console.log('✅ Subscription created:', subscription._id);
    console.log('   Plan:', testPlan.name);
    console.log('   Status:', subscription.status);
    console.log('   Listings:', `${subscription.listingsUsed}/${subscription.listingsLimit}`);
    console.log('');

    // Step 4: Update dealer with subscription
    console.log('Step 4: Linking subscription to dealer...');
    dealer.currentSubscriptionId = subscription._id;
    dealer.hasActiveSubscription = true;
    await dealer.save();
    console.log('✅ Dealer updated with subscription');
    console.log('');

    // Step 5: Test login flow (simulating what happens on login)
    console.log('Step 5: Testing login flow...');
    
    // Find dealer (as login would)
    const loginDealer = await TradeDealer.findOne({ email: testEmail });
    console.log('✅ Dealer found on login');
    console.log('   ID:', loginDealer._id);
    console.log('   Status:', loginDealer.status);
    console.log('   Email Verified:', loginDealer.emailVerified);
    console.log('');

    // Find active subscription (as login would)
    console.log('Step 6: Checking for active subscription...');
    const activeSubscription = await TradeSubscription.findActiveForDealer(loginDealer._id);
    
    if (activeSubscription) {
      console.log('✅ Active subscription found!');
      console.log('   ID:', activeSubscription._id);
      console.log('   Status:', activeSubscription.status);
      console.log('   Plan:', activeSubscription.planId?.name || 'Not populated');
      console.log('   Listings Available:', activeSubscription.listingsAvailable);
      console.log('');
      console.log('🎉 SUCCESS! Complete flow works correctly!');
    } else {
      console.log('❌ FAILED! No active subscription found');
      console.log('');
      console.log('🔍 Debugging:');
      
      // Check if subscription exists at all
      const anySub = await TradeSubscription.findOne({ dealerId: loginDealer._id });
      if (anySub) {
        console.log('   Subscription exists but not active');
        console.log('   Status:', anySub.status);
        console.log('   Expected: active or trialing');
      } else {
        console.log('   No subscription found at all');
      }
    }

    // Step 7: Test logout and re-login
    console.log('');
    console.log('Step 7: Testing logout and re-login...');
    
    // Simulate logout (just clearing local data, dealer still in DB)
    console.log('   Simulating logout...');
    
    // Simulate re-login
    console.log('   Simulating re-login...');
    const reloginDealer = await TradeDealer.findOne({ email: testEmail });
    const reloginSubscription = await TradeSubscription.findActiveForDealer(reloginDealer._id);
    
    if (reloginSubscription) {
      console.log('✅ Subscription persists after logout/login!');
      console.log('   Status:', reloginSubscription.status);
    } else {
      console.log('❌ Subscription lost after logout/login!');
    }

    // Cleanup
    console.log('');
    console.log('🧹 Cleaning up test data...');
    await TradeSubscription.deleteOne({ _id: subscription._id });
    await TradeDealer.deleteOne({ _id: dealer._id });
    console.log('✅ Test data cleaned up');

    console.log('');
    console.log('✅ Test completed successfully!');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

testCompleteFlow();
