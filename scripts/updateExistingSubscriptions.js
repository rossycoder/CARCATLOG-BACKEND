require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function updateExistingSubscriptions() {
  try {
    console.log('🔧 Updating existing subscriptions with listing limits...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all active subscriptions
    const subscriptions = await TradeSubscription.find({
      status: { $in: ['active', 'trialing'] }
    }).populate('planId');

    console.log(`📋 Found ${subscriptions.length} active subscriptions\n`);

    // Update each subscription with plan's listing limit
    for (const subscription of subscriptions) {
      if (subscription.planId) {
        const oldLimit = subscription.listingsLimit;
        subscription.listingsLimit = subscription.planId.listingLimit;
        await subscription.save();
        
        console.log(`✅ Updated subscription for dealer ${subscription.dealerId}`);
        console.log(`   Plan: ${subscription.planId.name}`);
        console.log(`   Old Limit: ${oldLimit === null ? 'Unlimited' : oldLimit}`);
        console.log(`   New Limit: ${subscription.listingsLimit}`);
        console.log(`   Current Usage: ${subscription.listingsUsed}/${subscription.listingsLimit}\n`);
      } else {
        console.log(`⚠️  Subscription ${subscription._id} has no plan associated\n`);
      }
    }

    console.log('✅ All subscriptions updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateExistingSubscriptions();
