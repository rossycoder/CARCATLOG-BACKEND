require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function checkDealerSubscriptionInfo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get ROSE dealer
    const roseDealer = await TradeDealer.findOne({ businessName: 'ROSE' });
    console.log('📋 ROSE Dealer Info:');
    console.log('   ID:', roseDealer._id);
    console.log('   Business Name:', roseDealer.businessName);
    console.log('   Email:', roseDealer.email);
    console.log('   Current Subscription ID:', roseDealer.currentSubscriptionId);
    console.log('');

    // Get subscription using currentSubscriptionId
    if (roseDealer.currentSubscriptionId) {
      const subscription = await TradeSubscription.findById(roseDealer.currentSubscriptionId)
        .populate('planId');
      
      if (subscription) {
        console.log('💳 Subscription Info:');
        console.log('   Subscription ID:', subscription._id);
        console.log('   Dealer ID:', subscription.dealerId);
        console.log('   Plan ID:', subscription.planId?._id);
        console.log('   Plan Name:', subscription.planId?.name);
        console.log('   Status:', subscription.status);
        console.log('   Is Trialing:', subscription.isTrialing);
        console.log('   Current Period End:', subscription.currentPeriodEnd);
        console.log('   Listings Used:', subscription.listingsUsed);
        console.log('   Listings Limit:', subscription.listingsLimit);
        console.log('');
      } else {
        console.log('❌ No subscription found with ID:', roseDealer.currentSubscriptionId);
        console.log('');
      }
    }

    // Try finding subscription by dealerId
    const subscriptionByDealer = await TradeSubscription.findOne({ 
      dealerId: roseDealer._id 
    }).populate('planId');
    
    if (subscriptionByDealer) {
      console.log('🔍 Subscription found by dealerId:');
      console.log('   Subscription ID:', subscriptionByDealer._id);
      console.log('   Plan Name:', subscriptionByDealer.planId?.name);
      console.log('   Status:', subscriptionByDealer.status);
      console.log('   Listings Used/Limit:', subscriptionByDealer.listingsUsed, '/', subscriptionByDealer.listingsLimit);
      console.log('');
    } else {
      console.log('❌ No subscription found for dealer ID:', roseDealer._id);
      console.log('');
    }

    // List all subscriptions
    const allSubscriptions = await TradeSubscription.find({})
      .populate('dealerId', 'businessName email')
      .populate('planId', 'name');
    
    console.log('📊 All Trade Subscriptions:');
    allSubscriptions.forEach((sub, index) => {
      console.log(`   ${index + 1}. ${sub.dealerId?.businessName || 'Unknown'}`);
      console.log(`      Plan: ${sub.planId?.name || 'Unknown'}`);
      console.log(`      Status: ${sub.status}`);
      console.log(`      Subscription ID: ${sub._id}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Done');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDealerSubscriptionInfo();
