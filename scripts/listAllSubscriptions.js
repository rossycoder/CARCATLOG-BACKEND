const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');

async function listAllSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const subscriptions = await TradeSubscription.find({}).populate('planId dealerId');
    
    console.log(`📋 Found ${subscriptions.length} subscription(s) in database:\n`);

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found in database!');
      console.log('This explains why dealers with currentSubscriptionId cannot access their subscriptions.\n');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`--- Subscription ${index + 1} ---`);
        console.log(`ID: ${sub._id}`);
        console.log(`Dealer: ${sub.dealerId?.businessName || 'Unknown'} (${sub.dealerId?._id})`);
        console.log(`Plan: ${sub.planId?.name || 'Unknown'}`);
        console.log(`Status: ${sub.status}`);
        console.log(`Stripe Sub ID: ${sub.stripeSubscriptionId}`);
        console.log(`Period: ${sub.currentPeriodStart} to ${sub.currentPeriodEnd}`);
        console.log(`Listings: ${sub.listingsUsed}/${sub.listingsLimit || '∞'}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAllSubscriptions();
