const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function fixDealerSubscriptionPlan() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the Auraluk dealer
    const dealer = await TradeDealer.findOne({ businessName: /auraluk/i });
    
    if (!dealer) {
      console.log('❌ Dealer "Auraluk" not found');
      return;
    }

    console.log('\n📊 Dealer:', dealer.businessName);

    // Find Bronze plan
    let plan = await SubscriptionPlan.findOne({ slug: 'bronze' });
    
    if (!plan) {
      console.log('❌ Bronze plan not found. Looking for any plan...');
      plan = await SubscriptionPlan.findOne();
      if (!plan) {
        console.log('❌ No plans found in database!');
        return;
      }
    }
    
    console.log('✅ Plan found:', plan.name, '(ID:', plan._id + ')');

    // Update subscription with correct plan reference
    const subscription = await TradeSubscription.findOne({ dealerId: dealer._id });
    
    if (subscription) {
      subscription.plan = plan._id;
      subscription.status = 'active';
      subscription.startDate = subscription.startDate || new Date();
      subscription.endDate = subscription.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await subscription.save();
      
      console.log('\n✅ Subscription updated!');
      console.log('  Status:', subscription.status);
      console.log('  Plan ID:', subscription.plan);
      console.log('  Listings Used:', subscription.listingsUsed);
      console.log('  Start Date:', subscription.startDate);
      console.log('  End Date:', subscription.endDate);
    } else {
      console.log('❌ No subscription found');
    }

    console.log('\n🎉 Done! Refresh the page and you should see "Publish Vehicle" button!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixDealerSubscriptionPlan();
