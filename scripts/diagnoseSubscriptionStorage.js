const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const diagnoseSubscriptions = async () => {
  try {
    const TradeSubscription = require('../models/TradeSubscription');
    const TradeDealer = require('../models/TradeDealer');
    const SubscriptionPlan = require('../models/SubscriptionPlan');

    console.log('\n📊 SUBSCRIPTION STORAGE DIAGNOSIS\n');

    // Check all subscriptions
    const allSubscriptions = await TradeSubscription.find().populate('dealerId planId');
    console.log(`Total subscriptions in database: ${allSubscriptions.length}`);
    
    if (allSubscriptions.length > 0) {
      console.log('\n📋 Subscriptions found:');
      allSubscriptions.forEach((sub, idx) => {
        console.log(`\n  ${idx + 1}. Subscription ID: ${sub._id}`);
        console.log(`     Dealer: ${sub.dealerId?.businessName || 'Unknown'} (${sub.dealerId?._id})`);
        console.log(`     Plan: ${sub.planId?.name || 'Unknown'} (${sub.planId?._id})`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Stripe Sub ID: ${sub.stripeSubscriptionId}`);
        console.log(`     Created: ${sub.createdAt}`);
        console.log(`     Updated: ${sub.updatedAt}`);
      });
    } else {
      console.log('❌ No subscriptions found in database');
    }

    // Check dealers with subscriptions
    const dealersWithSubs = await TradeDealer.find({ 
      currentSubscriptionId: { $exists: true, $ne: null } 
    });
    console.log(`\n\nDealers with subscription references: ${dealersWithSubs.length}`);
    
    if (dealersWithSubs.length > 0) {
      dealersWithSubs.forEach((dealer, idx) => {
        console.log(`\n  ${idx + 1}. ${dealer.businessName}`);
        console.log(`     Subscription ID: ${dealer.currentSubscriptionId}`);
        console.log(`     Status: ${dealer.status}`);
        console.log(`     Has Active Sub: ${dealer.hasActiveSubscription}`);
      });
    }

    // Check subscription plans
    const plans = await SubscriptionPlan.find();
    console.log(`\n\nSubscription plans in database: ${plans.length}`);
    plans.forEach((plan, idx) => {
      console.log(`\n  ${idx + 1}. ${plan.name}`);
      console.log(`     Stripe Price ID: ${plan.stripePriceId}`);
      console.log(`     Active: ${plan.isActive}`);
    });

    console.log('\n✅ Diagnosis complete\n');
  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

connectDB().then(() => diagnoseSubscriptions());
