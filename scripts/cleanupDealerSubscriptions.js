#!/usr/bin/env node
'use strict';

/**
 * Cleanup all subscriptions for a specific dealer
 * Usage: node scripts/cleanupDealerSubscriptions.js <dealer-email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function cleanupDealerSubscriptions(email) {
  try {
    console.log('\n🧹 CLEANUP DEALER SUBSCRIPTIONS');
    console.log('================================\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find dealer
    console.log(`🔍 Looking for dealer: ${email}`);
    const dealer = await TradeDealer.findOne({ email });

    if (!dealer) {
      console.log('❌ Dealer not found!');
      process.exit(1);
    }

    console.log(`✅ Dealer found: ${dealer.businessName}`);
    console.log(`   ID: ${dealer._id}\n`);

    // Find all subscriptions (without populate to avoid schema error)
    console.log('🔍 Looking for subscriptions...');
    const subscriptions = await TradeSubscription.find({ 
      dealerId: dealer._id 
    });

    if (subscriptions.length === 0) {
      console.log('ℹ️  No subscriptions found for this dealer\n');
      process.exit(0);
    }

    console.log(`📋 Found ${subscriptions.length} subscription(s):\n`);
    
    for (const sub of subscriptions) {
      const plan = await SubscriptionPlan.findById(sub.planId);
      console.log(`- Status: ${sub.status}`);
      console.log(`  Plan: ${plan?.name || 'Unknown'}`);
      console.log(`  Stripe Sub ID: ${sub.stripeSubscriptionId}`);
      console.log(`  Created: ${sub.createdAt}`);
      console.log('');
    }

    // Delete all subscriptions
    console.log('🗑️  Deleting all subscriptions...');
    const result = await TradeSubscription.deleteMany({ dealerId: dealer._id });
    console.log(`✅ Deleted ${result.deletedCount} subscription(s)\n`);

    // Update dealer (don't change status, just clear subscription)
    console.log('📝 Updating dealer...');
    dealer.currentSubscriptionId = null;
    dealer.hasActiveSubscription = false;
    // Don't change status - keep it as is
    await dealer.save();
    console.log('✅ Dealer updated\n');

    console.log('✅ CLEANUP COMPLETE!');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Next steps:');
    console.log('1. Go to frontend: /trade/subscription');
    console.log('2. Select a plan and complete Stripe checkout');
    console.log('3. This will create a proper subscription with payment method');
    console.log('─────────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide dealer email');
  console.error('Usage: node scripts/cleanupDealerSubscriptions.js <dealer-email>');
  process.exit(1);
}

cleanupDealerSubscriptions(email);
