const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function fixMissingSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find dealers with currentSubscriptionId but no actual subscription
    const dealers = await TradeDealer.find({ currentSubscriptionId: { $exists: true, $ne: null } });
    
    console.log(`📋 Found ${dealers.length} dealer(s) with subscription references:\n`);

    for (const dealer of dealers) {
      console.log(`--- Checking ${dealer.businessName} ---`);
      console.log(`Dealer ID: ${dealer._id}`);
      console.log(`Referenced Subscription ID: ${dealer.currentSubscriptionId}`);
      
      // Check if subscription exists
      const existingSub = await TradeSubscription.findById(dealer.currentSubscriptionId);
      
      if (existingSub) {
        console.log(`✅ Subscription exists, no fix needed`);
      } else {
        console.log(`❌ Subscription missing! Creating new subscription...`);
        
        // Get a default plan (let's use bronze for now)
        const plan = await SubscriptionPlan.findOne({ slug: 'bronze' });
        
        if (!plan) {
          console.log(`⚠️ No plan found, skipping...`);
          continue;
        }
        
        // Create new subscription
        const newSubscription = new TradeSubscription({
          dealerId: dealer._id,
          planId: plan._id,
          stripeSubscriptionId: `manual_fix_${Date.now()}_${dealer._id}`,
          stripeCustomerId: `manual_cus_${Date.now()}_${dealer._id}`,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          listingsLimit: plan.listingLimit,
          listingsUsed: 0
        });
        
        await newSubscription.save();
        console.log(`✅ Created new subscription: ${newSubscription._id}`);
        
        // Update dealer with new subscription ID
        dealer.currentSubscriptionId = newSubscription._id;
        dealer.status = 'active';
        await dealer.save();
        console.log(`✅ Updated dealer record`);
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

fixMissingSubscriptions();
