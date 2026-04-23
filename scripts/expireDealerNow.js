/**
 * Immediately expire a trade dealer subscription
 * Usage: node backend/scripts/expireDealerNow.js <dealerId or email>
 */

const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const Car = require('../models/Car');

async function expireDealerNow(dealerIdOrEmail) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motormate');
    console.log('✅ Connected to MongoDB');

    // Find dealer by ID or email
    let dealer;
    if (mongoose.Types.ObjectId.isValid(dealerIdOrEmail)) {
      dealer = await TradeDealer.findById(dealerIdOrEmail);
    }
    
    if (!dealer) {
      dealer = await TradeDealer.findOne({ email: dealerIdOrEmail });
    }

    if (!dealer) {
      console.error(`❌ Dealer not found: ${dealerIdOrEmail}`);
      console.log('\n💡 Listing all dealers:');
      const allDealers = await TradeDealer.find({}).select('_id businessName email status');
      allDealers.forEach(d => {
        console.log(`   ${d._id} - ${d.businessName} (${d.email}) - ${d.status}`);
      });
      process.exit(1);
    }

    console.log(`\n📋 Dealer: ${dealer.businessName} (${dealer.email})`);
    console.log(`   ID: ${dealer._id}`);
    console.log(`   Current Status: ${dealer.status}`);

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
    console.log(`   Current Status: ${subscription.status}`);
    console.log(`   Current Period End: ${subscription.currentPeriodEnd}`);
    console.log(`   Listings Used: ${subscription.listingsUsed}`);

    // Count active listings
    const activeListings = await Car.countDocuments({
      dealerId: dealer._id,
      advertStatus: 'active'
    });

    console.log(`\n📊 Active Listings: ${activeListings}`);

    // Confirm action
    console.log(`\n⚠️  This will:`);
    console.log(`   1. Set subscription status to 'expired'`);
    console.log(`   2. Deactivate ${activeListings} active listings`);
    console.log(`   3. Set dealer status to 'inactive'`);

    // Expire subscription
    subscription.status = 'expired';
    subscription.expiredAt = new Date();
    await subscription.save();
    console.log(`\n✅ Subscription expired`);

    // Deactivate all dealer's listings
    const result = await Car.updateMany(
      { dealerId: dealer._id, advertStatus: 'active' },
      { $set: { advertStatus: 'expired' } }
    );
    console.log(`✅ Deactivated ${result.modifiedCount} listings`);

    // Update dealer status
    dealer.hasActiveSubscription = false;
    dealer.status = 'suspended';
    await dealer.save();
    console.log(`✅ Dealer status set to 'inactive'`);

    // Update dealer stats
    dealer.stats = dealer.stats || {};
    dealer.stats.activeListings = 0;
    await dealer.save();
    console.log(`✅ Dealer stats updated`);

    console.log(`\n🎉 Dealer ${dealer.businessName} has been expired!`);
    console.log(`   - Subscription: expired`);
    console.log(`   - Dealer Status: inactive`);
    console.log(`   - Active Listings: 0`);

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get dealerId from command line
const dealerIdOrEmail = process.argv[2];

if (!dealerIdOrEmail) {
  console.error('Usage: node backend/scripts/expireDealerNow.js <dealerId or email>');
  console.error('Example: node backend/scripts/expireDealerNow.js 6998d213abfb4f8aa5b8a2e0');
  console.error('Example: node backend/scripts/expireDealerNow.js daniyalahmadrayan@gmail.com');
  process.exit(1);
}

expireDealerNow(dealerIdOrEmail);
