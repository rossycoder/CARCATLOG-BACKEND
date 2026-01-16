const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');

async function checkSpecificSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const subscriptionIds = [
      '6946b93f0ab58905c95204dc',
      '6964f7b520c0a7838005a8b5'
    ];

    for (const subId of subscriptionIds) {
      console.log(`--- Checking Subscription ${subId} ---`);
      
      const subscription = await TradeSubscription.findById(subId).populate('planId');
      
      if (subscription) {
        console.log(`✅ Found subscription:`);
        console.log(`   Dealer ID: ${subscription.dealerId}`);
        console.log(`   Plan: ${subscription.planId?.name || 'Unknown'}`);
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Stripe Sub ID: ${subscription.stripeSubscriptionId}`);
        console.log(`   Stripe Customer ID: ${subscription.stripeCustomerId}`);
        console.log(`   Current Period Start: ${subscription.currentPeriodStart}`);
        console.log(`   Current Period End: ${subscription.currentPeriodEnd}`);
        console.log(`   Listings Used: ${subscription.listingsUsed}`);
        console.log(`   Listings Limit: ${subscription.listingsLimit}`);
        console.log(`   Cancel At Period End: ${subscription.cancelAtPeriodEnd}`);
        console.log(`   Created At: ${subscription.createdAt}`);
        console.log(`   Updated At: ${subscription.updatedAt}`);
        
        // Check if it would match the findActiveForDealer query
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        console.log(`   Would match findActiveForDealer: ${isActive ? 'YES' : 'NO'}`);
        
        if (!isActive) {
          console.log(`   ⚠️ Status "${subscription.status}" is not "active" or "trialing"`);
        }
      } else {
        console.log(`❌ Subscription not found`);
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSpecificSubscriptions();
