#!/usr/bin/env node
/**
 * Verify Production Dealer Subscription
 * Checks if the dealer's subscription is properly saved and persists
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function verifyProductionDealer() {
  try {
    const dealerEmail = process.argv[2] || 'rozeenacareers031@gmail.com';

    console.log('🔍 Verifying Production Dealer');
    console.log('==============================\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);
    console.log('🔗 Database URI:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    console.log('');

    // Find dealer
    console.log(`🔍 Looking for dealer: ${dealerEmail}`);
    const dealer = await TradeDealer.findOne({ email: dealerEmail });

    if (!dealer) {
      console.error('❌ Dealer not found!');
      console.log('');
      console.log('💡 This means:');
      console.log('   1. You are connected to the wrong database');
      console.log('   2. The dealer email is incorrect');
      console.log('   3. The dealer was not created in this database');
      console.log('');
      console.log('🔧 To fix:');
      console.log('   - Check MONGODB_URI in .env file');
      console.log('   - Verify dealer email is correct');
      process.exit(1);
    }

    console.log('✅ Dealer found!');
    console.log('');
    console.log('📋 Dealer Information:');
    console.log('   ID:', dealer._id.toString());
    console.log('   Business Name:', dealer.businessName);
    console.log('   Email:', dealer.email);
    console.log('   Status:', dealer.status);
    console.log('   Email Verified:', dealer.emailVerified);
    console.log('   Created:', dealer.createdAt);
    console.log('   Last Login:', dealer.lastLoginAt || 'Never');
    console.log('   Stripe Customer ID:', dealer.stripeCustomerId || 'Not set');
    console.log('   Current Subscription ID:', dealer.currentSubscriptionId || 'Not set');
    console.log('   Has Active Subscription:', dealer.hasActiveSubscription || false);
    console.log('');

    // Check all subscriptions
    console.log('🔍 Checking subscriptions...');
    const allSubscriptions = await TradeSubscription.find({ 
      dealerId: dealer._id 
    }).populate('planId').sort({ createdAt: -1 });

    console.log(`📊 Total subscriptions: ${allSubscriptions.length}`);
    console.log('');

    if (allSubscriptions.length > 0) {
      allSubscriptions.forEach((sub, index) => {
        console.log(`Subscription #${index + 1}:`);
        console.log('   ID:', sub._id.toString());
        console.log('   Status:', sub.status);
        console.log('   Plan:', sub.planId?.name || 'Not populated');
        console.log('   Stripe Sub ID:', sub.stripeSubscriptionId);
        console.log('   Stripe Customer ID:', sub.stripeCustomerId);
        console.log('   Period Start:', sub.currentPeriodStart);
        console.log('   Period End:', sub.currentPeriodEnd);
        console.log('   Listings Used:', sub.listingsUsed);
        console.log('   Listings Limit:', sub.listingsLimit);
        console.log('   Created:', sub.createdAt);
        console.log('   Is Active:', sub.isActive);
        console.log('');
      });
    } else {
      console.log('❌ No subscriptions found!');
      console.log('');
    }

    // Test findActiveForDealer
    console.log('🔍 Testing findActiveForDealer method...');
    const activeSubscription = await TradeSubscription.findActiveForDealer(dealer._id);

    if (activeSubscription) {
      console.log('✅ Active subscription found!');
      console.log('   ID:', activeSubscription._id.toString());
      console.log('   Status:', activeSubscription.status);
      console.log('   Plan:', activeSubscription.planId?.name);
      console.log('   Listings Available:', activeSubscription.listingsAvailable);
      console.log('');
      console.log('🎉 DEALER IS READY TO USE THE SYSTEM!');
    } else {
      console.log('❌ No active subscription found!');
      console.log('');
      console.log('💡 This is why the dealer sees "No Active Subscription"');
      console.log('');
      
      if (allSubscriptions.length > 0) {
        const latestSub = allSubscriptions[0];
        console.log('🔧 Issue Analysis:');
        console.log('   Latest subscription status:', latestSub.status);
        console.log('   Expected status: "active" or "trialing"');
        console.log('');
        
        if (latestSub.status !== 'active' && latestSub.status !== 'trialing') {
          console.log('💡 Solution: Run the fix script to activate subscription');
          console.log('   node scripts/quickFixDealerSubscription.js', dealerEmail);
        }
      } else {
        console.log('🔧 Issue: No subscription exists');
        console.log('');
        console.log('💡 Possible causes:');
        console.log('   1. Stripe webhook did not fire');
        console.log('   2. Payment was not completed');
        console.log('   3. Subscription was created in different database');
        console.log('');
        console.log('💡 Solution: Run the fix script to create subscription');
        console.log('   node scripts/quickFixDealerSubscription.js', dealerEmail);
      }
    }

    // Check subscription plans
    console.log('');
    console.log('🔍 Checking subscription plans...');
    const plans = await SubscriptionPlan.find({ isActive: true });
    console.log(`📊 Active plans: ${plans.length}`);
    
    if (plans.length === 0) {
      console.log('⚠️  No subscription plans found!');
      console.log('💡 Run: node scripts/seedSubscriptionPlans.js');
    } else {
      console.log('✅ Plans available:');
      plans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.slug}): £${plan.price}/month, ${plan.listingLimit} listings`);
      });
    }

    console.log('');
    console.log('✅ Verification complete');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

verifyProductionDealer();
