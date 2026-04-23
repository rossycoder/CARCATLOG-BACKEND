/**
 * Expire Specific Trial Script
 * 
 * Specific email ke trial ko expire karne ke liye
 * 
 * Usage:
 *   node backend/scripts/expireSpecificTrial.js daniyalahmadrayan@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const { convertExpiredTrials } = require('../jobs/subscriptionCron');

async function expireSpecificTrial(email) {
  try {
    console.log('\n🧪 EXPIRE SPECIFIC TRIAL');
    console.log('================================\n');

    if (!email) {
      console.log('❌ Email not provided!');
      console.log('Usage: node backend/scripts/expireSpecificTrial.js <email>');
      console.log('Example: node backend/scripts/expireSpecificTrial.js daniyalahmadrayan@gmail.com\n');
      process.exit(1);
    }

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find dealer by email
    console.log(`🔍 Looking for dealer: ${email}`);
    const dealer = await TradeDealer.findOne({ email: email });

    if (!dealer) {
      console.log(`❌ Dealer not found with email: ${email}\n`);
      process.exit(1);
    }

    console.log(`✅ Dealer found: ${dealer.businessName}`);
    console.log(`   ID: ${dealer._id}\n`);

    // Find trialing subscription for this dealer
    console.log('🔍 Looking for trialing subscription...');
    const subscription = await TradeSubscription.findOne({
      dealerId: dealer._id,
      status: 'trialing'
    }).populate('planId');

    if (!subscription) {
      console.log('❌ No trialing subscription found for this dealer!');
      console.log('   Current subscriptions:');
      
      const allSubs = await TradeSubscription.find({ dealerId: dealer._id }).populate('planId');
      if (allSubs.length === 0) {
        console.log('   - No subscriptions found\n');
      } else {
        allSubs.forEach(sub => {
          console.log(`   - Status: ${sub.status}, Plan: ${sub.planId?.name || 'Unknown'}`);
        });
      }
      console.log();
      process.exit(1);
    }

    console.log('✅ Trialing subscription found!');
    console.log(`   Plan: ${subscription.planId?.name || 'Unknown'}`);
    console.log(`   Trial Start: ${subscription.trialStart?.toLocaleString() || 'N/A'}`);
    console.log(`   Trial End: ${subscription.trialEnd?.toLocaleString() || 'N/A'}`);
    console.log(`   Days Remaining: ${subscription.daysRemaining || 0}\n`);

    // Expire the trial
    console.log('⏰ Expiring trial...');
    const oldTrialEnd = subscription.trialEnd;
    subscription.trialEnd = new Date(Date.now() - 1000); // 1 second ago
    await subscription.save();

    console.log(`✅ Trial expired!`);
    console.log(`   Old Trial End: ${oldTrialEnd?.toLocaleString()}`);
    console.log(`   New Trial End: ${subscription.trialEnd.toLocaleString()}\n`);

    // Run conversion
    console.log('🔄 Running trial conversion process...\n');
    console.log('─────────────────────────────────────────────────────────');
    await convertExpiredTrials();
    console.log('─────────────────────────────────────────────────────────\n');

    // Check updated subscription
    console.log('📋 Checking updated subscription...');
    const updatedSub = await TradeSubscription.findById(subscription._id).populate('planId dealerId');

    console.log('\n✅ FINAL STATUS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Dealer: ${updatedSub.dealerId?.businessName}`);
    console.log(`Email: ${updatedSub.dealerId?.email}`);
    console.log(`Plan: ${updatedSub.planId?.name}`);
    console.log(`Status: ${updatedSub.status}`);
    console.log(`Is Trialing: ${updatedSub.isTrialing}`);
    console.log(`Stripe Subscription ID: ${updatedSub.stripeSubscriptionId || 'N/A'}`);
    console.log(`Current Period Start: ${updatedSub.currentPeriodStart?.toLocaleString() || 'N/A'}`);
    console.log(`Current Period End: ${updatedSub.currentPeriodEnd?.toLocaleString() || 'N/A'}`);
    console.log('─────────────────────────────────────────────────────────\n');

    if (updatedSub.status === 'active' && !updatedSub.isTrialing) {
      console.log('✅ SUCCESS! Trial converted to full subscription!');
      console.log('   - Stripe subscription created');
      console.log('   - Status changed to active');
      console.log('   - Dealer will be charged monthly now\n');
    } else if (updatedSub.status === 'past_due') {
      console.log('⚠️  WARNING! Subscription is past_due');
      console.log('   - Payment may have failed');
      console.log('   - Check Stripe dashboard for details');
      console.log('   - Dealer should have received payment failed email\n');
    } else {
      console.log('❌ Conversion may have failed!');
      console.log('   - Check logs above for errors');
      console.log('   - Verify Stripe API keys are correct\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];
expireSpecificTrial(email);
