#!/usr/bin/env node
/**
 * Quick fix for dealer subscription issue
 * This script can be run on production to immediately fix the subscription
 * 
 * Usage:
 *   node scripts/quickFixDealerSubscription.js <dealer-email>
 * 
 * Example:
 *   node scripts/quickFixDealerSubscription.js rozeenacareers031@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function quickFix() {
  try {
    // Get email from command line or use default
    const dealerEmail = process.argv[2] || 'rozeenacareers031@gmail.com';

    console.log('🔧 Quick Fix for Dealer Subscription');
    console.log('=====================================\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);
    console.log('');

    // Find dealer
    console.log(`🔍 Looking for dealer: ${dealerEmail}`);
    const dealer = await TradeDealer.findOne({ email: dealerEmail });

    if (!dealer) {
      console.error('❌ Dealer not found!');
      process.exit(1);
    }

    console.log('✅ Dealer found:', dealer.businessName);
    console.log('   ID:', dealer._id.toString());
    console.log('   Status:', dealer.status);
    console.log('');

    // Check for existing subscription
    console.log('🔍 Checking for existing subscription...');
    let subscription = await TradeSubscription.findOne({ 
      dealerId: dealer._id 
    }).populate('planId');

    if (subscription) {
      console.log('✅ Subscription found:', subscription._id.toString());
      console.log('   Status:', subscription.status);
      console.log('   Plan:', subscription.planId?.name || 'Unknown');
      console.log('');

      // Check if it's active
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        console.log('✅ Subscription is already active!');
        console.log('');
        
        // Verify with findActiveForDealer
        const activeCheck = await TradeSubscription.findActiveForDealer(dealer._id);
        if (activeCheck) {
          console.log('✅ findActiveForDealer also returns active subscription');
          console.log('');
          console.log('🎉 Everything is working correctly!');
          console.log('   If dealer still sees "No Active Subscription", check:');
          console.log('   1. Frontend is using correct API endpoint');
          console.log('   2. JWT token is valid');
          console.log('   3. Browser cache is cleared');
        } else {
          console.log('⚠️  Warning: Subscription exists but findActiveForDealer returns null');
          console.log('   This might be a query issue. Checking...');
          
          // Debug the query
          const debugSub = await TradeSubscription.findOne({
            dealerId: dealer._id,
            status: { $in: ['active', 'trialing'] }
          });
          
          if (debugSub) {
            console.log('✅ Direct query works, might be a populate issue');
          } else {
            console.log('❌ Query issue detected');
          }
        }
      } else {
        console.log('⚠️  Subscription exists but status is:', subscription.status);
        console.log('🔧 Activating subscription...');
        
        subscription.status = 'active';
        
        // Ensure dates are valid
        if (!subscription.currentPeriodStart || isNaN(subscription.currentPeriodStart.getTime())) {
          subscription.currentPeriodStart = new Date();
        }
        if (!subscription.currentPeriodEnd || isNaN(subscription.currentPeriodEnd.getTime())) {
          subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        
        await subscription.save();
        console.log('✅ Subscription activated!');
        console.log('');
      }
    } else {
      console.log('❌ No subscription found');
      console.log('🔧 Creating new subscription...');
      console.log('');

      // Get a plan
      let plan = await SubscriptionPlan.findOne({ slug: 'starter' });
      
      if (!plan) {
        console.log('⚠️  Starter plan not found, looking for any plan...');
        plan = await SubscriptionPlan.findOne();
      }

      if (!plan) {
        console.error('❌ No subscription plans found in database!');
        console.log('');
        console.log('💡 Please run: node scripts/seedSubscriptionPlans.js');
        process.exit(1);
      }

      console.log('📦 Using plan:', plan.name);
      console.log('   Price:', plan.price);
      console.log('   Listings:', plan.listingLimit);
      console.log('');

      // Create subscription
      subscription = new TradeSubscription({
        dealerId: dealer._id,
        planId: plan._id,
        stripeSubscriptionId: dealer.stripeCustomerId || `manual_${Date.now()}`,
        stripeCustomerId: dealer.stripeCustomerId || `cus_${Date.now()}`,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        listingsLimit: plan.listingLimit,
        listingsUsed: 0
      });

      await subscription.save();
      console.log('✅ Subscription created:', subscription._id.toString());
      console.log('');
    }

    // Update dealer record
    console.log('🔧 Updating dealer record...');
    dealer.currentSubscriptionId = subscription._id;
    dealer.hasActiveSubscription = true;
    dealer.status = 'active';
    await dealer.save();
    console.log('✅ Dealer updated');
    console.log('');

    // Final verification
    console.log('🔍 Final verification...');
    const finalCheck = await TradeSubscription.findActiveForDealer(dealer._id);
    
    if (finalCheck) {
      console.log('✅ SUCCESS! Active subscription confirmed');
      console.log('');
      console.log('📊 Subscription Details:');
      console.log('   ID:', finalCheck._id.toString());
      console.log('   Plan:', finalCheck.planId?.name);
      console.log('   Status:', finalCheck.status);
      console.log('   Listings Used:', finalCheck.listingsUsed);
      console.log('   Listings Limit:', finalCheck.listingsLimit);
      console.log('   Period End:', finalCheck.currentPeriodEnd);
      console.log('');
      console.log('🎉 Dealer can now login and access dashboard!');
    } else {
      console.log('❌ FAILED! Still no active subscription found');
      console.log('');
      console.log('🔍 Debugging info:');
      console.log('   Dealer ID:', dealer._id.toString());
      console.log('   Subscription ID:', subscription._id.toString());
      console.log('   Subscription Status:', subscription.status);
      console.log('');
      console.log('💡 Please check:');
      console.log('   1. Database connection is correct');
      console.log('   2. Models are properly defined');
      console.log('   3. No middleware interfering with queries');
    }

    console.log('');
    console.log('✅ Script completed');
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

// Run the fix
quickFix();
