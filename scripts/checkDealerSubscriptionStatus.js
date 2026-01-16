const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function checkDealerSubscriptionStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all dealers
    const dealers = await TradeDealer.find({});
    
    console.log(`📋 Checking subscription status for ${dealers.length} dealers:\n`);

    for (const dealer of dealers) {
      console.log(`--- ${dealer.businessName} (${dealer.email}) ---`);
      console.log(`Dealer ID: ${dealer._id}`);
      console.log(`Status: ${dealer.status}`);
      console.log(`Current Subscription ID: ${dealer.currentSubscriptionId || 'None'}`);
      
      // Find active subscription
      const subscription = await TradeSubscription.findActiveForDealer(dealer._id);
      
      if (subscription) {
        console.log(`✅ HAS ACTIVE SUBSCRIPTION:`);
        console.log(`   Subscription ID: ${subscription._id}`);
        console.log(`   Plan: ${subscription.planId?.name || 'Unknown'}`);
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Stripe Sub ID: ${subscription.stripeSubscriptionId}`);
        console.log(`   Period: ${subscription.currentPeriodStart} to ${subscription.currentPeriodEnd}`);
        console.log(`   Listings: ${subscription.listingsUsed}/${subscription.listingsLimit || '∞'}`);
      } else {
        console.log(`❌ NO ACTIVE SUBSCRIPTION`);
        
        // Check if there are any subscriptions at all
        const allSubs = await TradeSubscription.find({ dealerId: dealer._id });
        if (allSubs.length > 0) {
          console.log(`   Found ${allSubs.length} inactive subscription(s):`);
          allSubs.forEach(sub => {
            console.log(`   - ID: ${sub._id}, Status: ${sub.status}, Stripe: ${sub.stripeSubscriptionId}`);
          });
        }
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

checkDealerSubscriptionStatus();
