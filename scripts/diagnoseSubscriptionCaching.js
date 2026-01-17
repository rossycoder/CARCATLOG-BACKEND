require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function diagnoseSubscriptionCaching() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Checking Subscription Caching Issue\n');
    console.log('Problem: After purchasing subscription, it shows "No active subscription"');
    console.log('         But after logout/login, subscription appears active\n');

    // Find dealers with subscriptions
    const dealers = await TradeDealer.find({}).select('businessName email');
    
    for (const dealer of dealers) {
      const subscription = await TradeSubscription.findActiveForDealer(dealer._id);
      
      console.log(`Dealer: ${dealer.businessName}`);
      console.log(`  Email: ${dealer.email}`);
      console.log(`  Has Active Subscription: ${subscription ? 'YES' : 'NO'}`);
      if (subscription) {
        console.log(`  Plan: ${subscription.planId?.name || 'Unknown'}`);
        console.log(`  Status: ${subscription.status}`);
      }
      console.log('');
    }

    console.log('\n📋 Root Cause Analysis:');
    console.log('1. When user logs in → subscription data is fetched and stored in localStorage');
    console.log('2. When user buys subscription → database is updated');
    console.log('3. BUT → localStorage still has old data (no subscription)');
    console.log('4. Frontend shows "No subscription" because it reads from localStorage');
    console.log('5. After logout/login → fresh data is fetched from database → shows subscription\n');

    console.log('✅ Solution:');
    console.log('After successful subscription purchase, we need to:');
    console.log('1. Fetch fresh dealer data from /api/trade/auth/me');
    console.log('2. Update localStorage with new subscription data');
    console.log('3. Update React state to trigger re-render\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

diagnoseSubscriptionCaching();
