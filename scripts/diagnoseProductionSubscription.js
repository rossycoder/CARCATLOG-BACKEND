require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function diagnoseProductionSubscription() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🔗 Connection String:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    const dealerEmail = 'rozeenacareers031@gmail.com';

    console.log('\n' + '='.repeat(60));
    console.log('DEALER DIAGNOSIS');
    console.log('='.repeat(60));

    const dealer = await TradeDealer.findOne({ email: dealerEmail });
    if (!dealer) {
      console.error('❌ Dealer not found');
      process.exit(1);
    }

    console.log('\n📋 Dealer Information:');
    console.log('  ID:', dealer._id.toString());
    console.log('  Business Name:', dealer.businessName);
    console.log('  Email:', dealer.email);
    console.log('  Status:', dealer.status);
    console.log('  Email Verified:', dealer.emailVerified);
    console.log('  Created At:', dealer.createdAt);
    console.log('  Last Login:', dealer.lastLoginAt);
    console.log('  Stripe Customer ID:', dealer.stripeCustomerId || 'NOT SET');
    console.log('  Current Subscription ID:', dealer.currentSubscriptionId || 'NOT SET');

    console.log('\n' + '='.repeat(60));
    console.log('SUBSCRIPTION DIAGNOSIS');
    console.log('='.repeat(60));

    // Check all subscriptions for this dealer
    const allSubscriptions = await TradeSubscription.find({ 
      dealerId: dealer._id 
    }).populate('planId').sort({ createdAt: -1 });

    console.log(`\n📊 Total subscriptions found: ${allSubscriptions.length}`);

    if (allSubscriptions.length > 0) {
      allSubscriptions.forEach((sub, index) => {
        console.log(`\n  Subscription #${index + 1}:`);
        console.log('    ID:', sub._id.toString());
        console.log('    Status:', sub.status);
        console.log('    Plan:', sub.planId?.name || 'NOT POPULATED');
        console.log('    Stripe Sub ID:', sub.stripeSubscriptionId);
        console.log('    Stripe Customer ID:', sub.stripeCustomerId);
        console.log('    Period Start:', sub.currentPeriodStart);
        console.log('    Period End:', sub.currentPeriodEnd);
        console.log('    Listings Used:', sub.listingsUsed);
        console.log('    Listings Limit:', sub.listingsLimit);
        console.log('    Created At:', sub.createdAt);
        console.log('    Is Active:', sub.isActive);
      });
    } else {
      console.log('  ❌ No subscriptions found for this dealer');
    }

    // Check using the static method
    console.log('\n🔍 Testing findActiveForDealer method:');
    const activeSubscription = await TradeSubscription.findActiveForDealer(dealer._id);
    
    if (activeSubscription) {
      console.log('  ✅ Active subscription found');
      console.log('    ID:', activeSubscription._id.toString());
      console.log('    Status:', activeSubscription.status);
      console.log('    Plan:', activeSubscription.planId?.name);
    } else {
      console.log('  ❌ No active subscription found');
      console.log('  This is why the dealer sees "No Active Subscription"');
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUBSCRIPTION PLANS');
    console.log('='.repeat(60));

    const plans = await SubscriptionPlan.find();
    console.log(`\n📊 Total plans in database: ${plans.length}`);
    
    if (plans.length > 0) {
      plans.forEach((plan, index) => {
        console.log(`\n  Plan #${index + 1}:`);
        console.log('    ID:', plan._id.toString());
        console.log('    Name:', plan.name);
        console.log('    Slug:', plan.slug);
        console.log('    Price:', plan.price);
        console.log('    Listing Limit:', plan.listingLimit);
        console.log('    Stripe Price ID:', plan.stripePriceId);
      });
    } else {
      console.log('  ⚠️  No subscription plans found');
      console.log('  Run: node backend/scripts/seedSubscriptionPlans.js');
    }

    console.log('\n' + '='.repeat(60));
    console.log('ENVIRONMENT CHECK');
    console.log('='.repeat(60));

    console.log('\n🔧 Environment Variables:');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET');
    console.log('  STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('  STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ SET' : '❌ NOT SET');
    console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
    console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');

    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(60));

    if (!activeSubscription && allSubscriptions.length > 0) {
      const latestSub = allSubscriptions[0];
      console.log('\n⚠️  Issue: Subscription exists but is not active');
      console.log(`   Current status: ${latestSub.status}`);
      console.log('\n💡 Solution: Run the fix script:');
      console.log('   node backend/scripts/fixProductionSubscription.js');
    } else if (!activeSubscription && allSubscriptions.length === 0) {
      console.log('\n⚠️  Issue: No subscription record exists');
      console.log('\n💡 Possible causes:');
      console.log('   1. Stripe webhook not configured or not firing');
      console.log('   2. Different database in production vs development');
      console.log('   3. Subscription created but not saved to database');
      console.log('\n💡 Solution: Run the fix script to create subscription:');
      console.log('   node backend/scripts/fixProductionSubscription.js');
    } else {
      console.log('\n✅ Everything looks good!');
    }

    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

diagnoseProductionSubscription();
