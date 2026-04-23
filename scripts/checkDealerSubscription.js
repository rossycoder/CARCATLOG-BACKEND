/**
 * Check dealer subscription details
 * Usage: node backend/scripts/checkDealerSubscription.js <email>
 */

const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const Car = require('../models/Car');

async function checkDealerSubscription(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motormate');
    console.log('✅ Connected to MongoDB\n');

    // Find dealer (case-insensitive email search)
    const dealer = await TradeDealer.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    
    if (!dealer) {
      console.error(`❌ Dealer not found: ${email}`);
      console.log('\n💡 Available dealers:');
      const allDealers = await TradeDealer.find({}).select('email businessName');
      allDealers.forEach(d => {
        console.log(`   - ${d.email} (${d.businessName})`);
      });
      process.exit(1);
    }

    console.log('📋 DEALER INFORMATION');
    console.log('='.repeat(80));
    console.log(`Business Name: ${dealer.businessName}`);
    console.log(`Email: ${dealer.email}`);
    console.log(`Status: ${dealer.status}`);
    console.log(`Email Verified: ${dealer.emailVerified ? '✅' : '❌'}`);
    console.log(`Current Subscription ID: ${dealer.currentSubscriptionId || 'None'}`);
    console.log(`Has Active Subscription: ${dealer.hasActiveSubscription ? '✅' : '❌'}`);

    // Find all subscriptions for this dealer
    const allSubscriptions = await TradeSubscription.find({ 
      dealerId: dealer._id 
    }).populate('planId').sort({ createdAt: -1 });

    console.log(`\n📦 SUBSCRIPTIONS (${allSubscriptions.length} total)`);
    console.log('='.repeat(80));

    if (allSubscriptions.length === 0) {
      console.log('❌ No subscriptions found for this dealer');
    } else {
      allSubscriptions.forEach((sub, index) => {
        console.log(`\n${index + 1}. Subscription ID: ${sub._id}`);
        console.log(`   Plan: ${sub.planId?.name || 'Unknown'}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Stripe Subscription ID: ${sub.stripeSubscriptionId}`);
        console.log(`   Current Period: ${sub.currentPeriodStart?.toDateString()} → ${sub.currentPeriodEnd?.toDateString()}`);
        console.log(`   Days Remaining: ${sub.daysRemaining}`);
        console.log(`   Listings Used: ${sub.listingsUsed} / ${sub.listingsLimit || '∞'}`);
        console.log(`   Is Trialing: ${sub.isTrialing ? '✅' : '❌'}`);
        if (sub.isTrialing) {
          console.log(`   Trial End: ${sub.trialEnd?.toDateString()}`);
          console.log(`   Trial Days Left: ${sub.trialDaysLeft}`);
        }
        console.log(`   Cancel At Period End: ${sub.cancelAtPeriodEnd ? '✅' : '❌'}`);
        if (sub.expiredAt) {
          console.log(`   Expired At: ${sub.expiredAt.toDateString()}`);
        }
        console.log(`   Created: ${sub.createdAt.toDateString()}`);
      });
    }

    // Count active listings
    const activeListings = await Car.countDocuments({
      dealerId: dealer._id,
      advertStatus: 'active'
    });

    const allListings = await Car.countDocuments({
      dealerId: dealer._id
    });

    console.log(`\n🚗 LISTINGS`);
    console.log('='.repeat(80));
    console.log(`Total Listings: ${allListings}`);
    console.log(`Active Listings: ${activeListings}`);

    // Show what needs to be done
    console.log(`\n💡 ACTIONS`);
    console.log('='.repeat(80));

    const activeSubscription = allSubscriptions.find(s => 
      s.status === 'active' || s.status === 'trialing'
    );

    if (activeSubscription) {
      console.log(`✅ Active subscription found: ${activeSubscription._id}`);
      console.log(`\nTo expire this subscription in 1 day:`);
      console.log(`   node backend/scripts/expireDealerSubscription.js ${email}`);
      console.log(`\nTo expire immediately:`);
      console.log(`   node backend/scripts/expireDealerNow.js ${email}`);
    } else {
      console.log(`❌ No active subscription found`);
      console.log(`\nThis dealer needs to:`);
      console.log(`   1. Subscribe to a plan from the Trade Dashboard`);
      console.log(`   2. Or reactivate an existing subscription via Stripe`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: node backend/scripts/checkDealerSubscription.js <email>');
  console.error('Example: node backend/scripts/checkDealerSubscription.js daniyalahmadrayan@gmail.com');
  process.exit(1);
}

checkDealerSubscription(email);
