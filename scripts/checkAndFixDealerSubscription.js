const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function checkAndFixDealerSubscription() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the Auraluk dealer
    const dealer = await TradeDealer.findOne({ businessName: /auraluk/i });
    
    if (!dealer) {
      console.log('❌ Dealer "Auraluk" not found');
      return;
    }

    console.log('\n📊 Dealer Info:');
    console.log('  ID:', dealer._id);
    console.log('  Business Name:', dealer.businessName);
    console.log('  Email:', dealer.email);

    // Check for existing subscription
    let subscription = await TradeSubscription.findOne({ dealerId: dealer._id });
    
    if (subscription) {
      const plan = await SubscriptionPlan.findById(subscription.plan);
      console.log('\n📋 Existing Subscription:');
      console.log('  Status:', subscription.status);
      console.log('  Plan:', plan?.name);
      console.log('  Listings Used:', subscription.listingsUsed);
      console.log('  Start Date:', subscription.startDate);
      console.log('  End Date:', subscription.endDate);
      
      // If subscription exists but is not active, activate it
      if (subscription.status !== 'active') {
        console.log('\n🔧 Activating subscription...');
        subscription.status = 'active';
        subscription.startDate = new Date();
        subscription.endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        await subscription.save();
        console.log('✅ Subscription activated!');
      } else {
        console.log('\n✅ Subscription is already active');
      }
    } else {
      console.log('\n❌ No subscription found. Creating one...');
      
      // Find a subscription plan (Bronze by default)
      let plan = await SubscriptionPlan.findOne({ name: 'Bronze' });
      
      if (!plan) {
        console.log('Creating Bronze plan...');
        plan = await SubscriptionPlan.create({
          name: 'Bronze',
          price: 1000,
          listingsLimit: 10,
          features: ['10 active listings', 'Basic analytics', 'Email support'],
          stripePriceId: 'price_bronze'
        });
      }

      // Create subscription
      subscription = await TradeSubscription.create({
        dealerId: dealer._id,
        plan: plan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        listingsUsed: 0,
        paymentMethod: 'manual_activation'
      });

      console.log('✅ Subscription created and activated!');
      console.log('  Plan:', plan.name);
      console.log('  Listings Limit:', plan.listingsLimit);
    }

    // Verify the fix
    const updatedSubscription = await TradeSubscription.findOne({ dealerId: dealer._id });
    const finalPlan = await SubscriptionPlan.findById(updatedSubscription.plan);
    console.log('\n✅ Final Status:');
    console.log('  Subscription Status:', updatedSubscription.status);
    console.log('  Plan:', finalPlan.name);
    console.log('  Listings Limit:', finalPlan.listingsLimit);
    console.log('  Listings Used:', updatedSubscription.listingsUsed);

    console.log('\n🎉 Done! Your subscription is now active.');
    console.log('   Refresh the page and you should see "Publish Vehicle" button!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkAndFixDealerSubscription();
