/**
 * Manually expire a trade dealer subscription
 * Usage: node backend/scripts/expireDealerSubscription.js <dealerId>
 */

const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const Car = require('../models/Car');

async function expireDealerSubscription(dealerId) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motormate');
    console.log('✅ Connected to MongoDB');

    // Find dealer
    const dealer = await TradeDealer.findById(dealerId);
    if (!dealer) {
      console.error(`❌ Dealer not found: ${dealerId}`);
      process.exit(1);
    }

    console.log(`\n📋 Dealer: ${dealer.businessName} (${dealer.email})`);
    console.log(`   Status: ${dealer.status}`);

    // Find active subscription
    const subscription = await TradeSubscription.findOne({
      dealerId: dealer._id,
      status: { $in: ['active', 'trialing'] }
    }).populate('planId');

    if (!subscription) {
      console.error(`❌ No active subscription found for dealer`);
      process.exit(1);
    }

    console.log(`\n📦 Subscription: ${subscription.planId?.name || 'Unknown'}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Current Period End: ${subscription.currentPeriodEnd}`);
    console.log(`   Listings Used: ${subscription.listingsUsed}`);

    // Set expiry to 1 day from now
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    subscription.currentPeriodEnd = oneDayFromNow;
    await subscription.save();

    console.log(`\n✅ Subscription will expire in 1 day: ${oneDayFromNow}`);
    console.log(`   The hourly cron job will automatically:`);
    console.log(`   - Set subscription status to 'expired'`);
    console.log(`   - Deactivate all dealer listings`);
    console.log(`   - Set dealer status to 'inactive'`);
    console.log(`   - Send expiration email`);

    console.log(`\n💡 To expire immediately, run:`);
    console.log(`   node backend/scripts/expireDealerNow.js ${dealerId}`);

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get dealerId from command line
const dealerId = process.argv[2];

if (!dealerId) {
  console.error('Usage: node backend/scripts/expireDealerSubscription.js <dealerId>');
  console.error('Example: node backend/scripts/expireDealerSubscription.js 6998d213abfb4f8aa5b8a2e0');
  process.exit(1);
}

expireDealerSubscription(dealerId);
