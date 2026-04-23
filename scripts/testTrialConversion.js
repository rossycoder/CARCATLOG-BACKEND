/**
 * Test Trial Conversion Script
 * 
 * Ye script trial subscription ko manually expire karke test karne ke liye hai.
 * 30 days ka intezar nahi karna padega!
 * 
 * Usage:
 *   node backend/scripts/testTrialConversion.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const { convertExpiredTrials } = require('../jobs/subscriptionCron');

async function testTrialConversion() {
  try {
    console.log('\n🧪 TRIAL CONVERSION TEST SCRIPT');
    console.log('================================\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all trialing subscriptions
    const trialingSubscriptions = await TradeSubscription.find({
      status: 'trialing'
    }).populate('dealerId planId');

    console.log(`📋 Found ${trialingSubscriptions.length} trialing subscription(s)\n`);

    if (trialingSubscriptions.length === 0) {
      console.log('❌ No trialing subscriptions found!');
      console.log('   Create a trial subscription first by making a payment.\n');
      process.exit(0);
    }

    // Show all trialing subscriptions
    console.log('Current Trialing Subscriptions:');
    console.log('─────────────────────────────────────────────────────────');
    trialingSubscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Dealer: ${sub.dealerId?.businessName || 'Unknown'}`);
      console.log(`   Email: ${sub.dealerId?.email || 'N/A'}`);
      console.log(`   Plan: ${sub.planId?.name || 'Unknown'}`);
      console.log(`   Trial Start: ${sub.trialStart?.toLocaleString() || 'N/A'}`);
      console.log(`   Trial End: ${sub.trialEnd?.toLocaleString() || 'N/A'}`);
      console.log(`   Days Remaining: ${sub.daysRemaining || 0}`);
    });
    console.log('\n─────────────────────────────────────────────────────────\n');

    // Ask user which subscription to expire
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question('Enter subscription number to expire (or "all" for all): ', resolve);
    });
    readline.close();

    let subscriptionsToExpire = [];

    if (answer.toLowerCase() === 'all') {
      subscriptionsToExpire = trialingSubscriptions;
    } else {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < trialingSubscriptions.length) {
        subscriptionsToExpire = [trialingSubscriptions[index]];
      } else {
        console.log('❌ Invalid selection!');
        process.exit(1);
      }
    }

    console.log(`\n🔄 Expiring ${subscriptionsToExpire.length} subscription(s)...\n`);

    // Expire selected subscriptions
    for (const sub of subscriptionsToExpire) {
      console.log(`⏰ Expiring trial for: ${sub.dealerId?.businessName}`);
      
      // Set trial end to now (expired)
      sub.trialEnd = new Date(Date.now() - 1000); // 1 second ago
      await sub.save();
      
      console.log(`✅ Trial end date updated to: ${sub.trialEnd.toLocaleString()}`);
    }

    console.log('\n✅ Trial(s) expired successfully!\n');

    // Now run the conversion function
    console.log('🔄 Running trial conversion process...\n');
    await convertExpiredTrials();

    console.log('\n✅ TEST COMPLETE!');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Check the logs above to see if:');
    console.log('  1. Stripe subscription was created');
    console.log('  2. Status changed from "trialing" to "active"');
    console.log('  3. Email was sent to dealer');
    console.log('─────────────────────────────────────────────────────────\n');

    // Show updated subscription
    const updatedSubs = await TradeSubscription.find({
      _id: { $in: subscriptionsToExpire.map(s => s._id) }
    }).populate('dealerId planId');

    console.log('Updated Subscription Status:');
    console.log('─────────────────────────────────────────────────────────');
    updatedSubs.forEach((sub, index) => {
      console.log(`\n${index + 1}. Dealer: ${sub.dealerId?.businessName || 'Unknown'}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Is Trialing: ${sub.isTrialing}`);
      console.log(`   Stripe Subscription ID: ${sub.stripeSubscriptionId || 'N/A'}`);
      console.log(`   Current Period End: ${sub.currentPeriodEnd?.toLocaleString() || 'N/A'}`);
    });
    console.log('\n─────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testTrialConversion();
