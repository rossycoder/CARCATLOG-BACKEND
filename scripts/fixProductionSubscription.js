require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function fixProductionSubscription() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.name);

    // Find the dealer by email
    const dealerEmail = 'rozeenacareers031@gmail.com';
    const dealer = await TradeDealer.findOne({ email: dealerEmail });

    if (!dealer) {
      console.error('❌ Dealer not found with email:', dealerEmail);
      process.exit(1);
    }

    console.log('\n📋 Dealer Info:');
    console.log('ID:', dealer._id);
    console.log('Business Name:', dealer.businessName);
    console.log('Email:', dealer.email);
    console.log('Status:', dealer.status);
    console.log('Email Verified:', dealer.emailVerified);
    console.log('Stripe Customer ID:', dealer.stripeCustomerId);
    console.log('Current Subscription ID:', dealer.currentSubscriptionId);

    // Check for existing subscription
    const existingSubscription = await TradeSubscription.findOne({ 
      dealerId: dealer._id 
    }).populate('planId');

    console.log('\n🔍 Checking for existing subscription...');
    if (existingSubscription) {
      console.log('✅ Found existing subscription:');
      console.log('ID:', existingSubscription._id);
      console.log('Status:', existingSubscription.status);
      console.log('Plan:', existingSubscription.planId?.name);
      console.log('Stripe Subscription ID:', existingSubscription.stripeSubscriptionId);
      console.log('Current Period End:', existingSubscription.currentPeriodEnd);
      console.log('Listings Used:', existingSubscription.listingsUsed);
      console.log('Listings Limit:', existingSubscription.listingsLimit);

      // Check if it's active
      const activeSubscription = await TradeSubscription.findActiveForDealer(dealer._id);
      if (activeSubscription) {
        console.log('\n✅ Active subscription found via findActiveForDealer');
      } else {
        console.log('\n⚠️  Subscription exists but is not active');
        console.log('Current status:', existingSubscription.status);
        
        // Fix the status if needed
        if (existingSubscription.status !== 'active') {
          console.log('\n🔧 Fixing subscription status...');
          existingSubscription.status = 'active';
          await existingSubscription.save();
          console.log('✅ Subscription status updated to active');
        }
      }
    } else {
      console.log('❌ No subscription found for this dealer');
      console.log('\n🔧 Creating subscription...');

      // Get a default plan (starter plan)
      let plan = await SubscriptionPlan.findOne({ slug: 'starter' });
      
      if (!plan) {
        console.log('⚠️  No starter plan found, using first available plan');
        plan = await SubscriptionPlan.findOne();
      }

      if (!plan) {
        console.error('❌ No subscription plans found in database');
        console.log('Please run: node backend/scripts/seedSubscriptionPlans.js');
        process.exit(1);
      }

      console.log('Using plan:', plan.name);

      // Create subscription
      const subscription = new TradeSubscription({
        dealerId: dealer._id,
        planId: plan._id,
        stripeSubscriptionId: dealer.stripeCustomerId || `manual_${Date.now()}`,
        stripeCustomerId: dealer.stripeCustomerId || `cus_${Date.now()}`,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        listingsLimit: plan.listingLimit,
        listingsUsed: 0
      });

      await subscription.save();
      console.log('✅ Subscription created:', subscription._id);

      // Update dealer
      dealer.currentSubscriptionId = subscription._id;
      dealer.hasActiveSubscription = true;
      await dealer.save();
      console.log('✅ Dealer updated with subscription');
    }

    // Final verification
    console.log('\n🔍 Final Verification:');
    const finalCheck = await TradeSubscription.findActiveForDealer(dealer._id);
    if (finalCheck) {
      console.log('✅ Active subscription confirmed');
      console.log('Plan:', finalCheck.planId?.name);
      console.log('Status:', finalCheck.status);
      console.log('Listings Available:', finalCheck.listingsAvailable);
    } else {
      console.log('❌ Still no active subscription found');
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixProductionSubscription();
