const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function createTestSub() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get dealer
    const dealer = await TradeDealer.findOne();
    if (!dealer) {
      console.log('❌ No dealer found');
      process.exit(1);
    }

    console.log(`\n📊 Dealer: ${dealer.businessName}`);

    // Get a plan
    const plan = await SubscriptionPlan.findOne({ slug: 'silver' });
    if (!plan) {
      console.log('❌ No plan found');
      process.exit(1);
    }

    console.log(`📋 Plan: ${plan.name}`);

    // Check if subscription already exists
    const existing = await TradeSubscription.findOne({ dealerId: dealer._id });
    if (existing) {
      console.log('✅ Subscription already exists');
      process.exit(0);
    }

    // Create subscription
    const subscription = new TradeSubscription({
      dealerId: dealer._id,
      planId: plan._id,
      stripeSubscriptionId: 'sub_test_' + Date.now(),
      stripeCustomerId: 'cus_test_' + Date.now(),
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      listingsLimit: plan.listingLimit
    });

    await subscription.save();
    console.log(`\n✅ Created subscription:`);
    console.log(`  - Status: ${subscription.status}`);
    console.log(`  - Listings Limit: ${subscription.listingsLimit}`);
    console.log(`  - Period End: ${subscription.currentPeriodEnd.toLocaleDateString()}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestSub();
