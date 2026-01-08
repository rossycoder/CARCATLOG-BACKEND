const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all dealers
    const dealers = await TradeDealer.find().lean();
    console.log(`\n📊 Found ${dealers.length} dealers:\n`);

    for (const dealer of dealers) {
      console.log(`Dealer: ${dealer.businessName} (${dealer.email})`);
      
      // Check subscription
      const sub = await TradeSubscription.findOne({ dealerId: dealer._id }).populate('planId').lean();
      if (sub) {
        console.log(`  ✅ Subscription: ${sub.status} - ${sub.planId?.name} (${sub.listingsLimit} listings)`);
      } else {
        console.log(`  ❌ No subscription`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

check();
