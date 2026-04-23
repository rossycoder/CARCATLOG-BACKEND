#!/usr/bin/env node
'use strict';

/**
 * Reactivate expired cars for a dealer with active subscription
 * Usage: node scripts/reactivateDealerCars.js <dealer-email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Car = require('../models/Car');

async function reactivateDealerCars(email) {
  try {
    console.log('\n🔄 REACTIVATE DEALER CARS');
    console.log('================================\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find dealer
    console.log(`🔍 Looking for dealer: ${email}`);
    const dealer = await TradeDealer.findOne({ email });
    
    if (!dealer) {
      console.log('❌ Dealer not found!');
      process.exit(1);
    }

    console.log(`✅ Dealer found: ${dealer.businessName}`);
    console.log(`   ID: ${dealer._id}\n`);

    // Check subscription (without populate to avoid schema error)
    console.log('🔍 Checking subscription status...');
    const subscription = await TradeSubscription.findOne({
      dealerId: dealer._id,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscription) {
      console.log('❌ No active subscription found!');
      console.log('   Dealer must have an active subscription to reactivate cars\n');
      process.exit(1);
    }

    const plan = await SubscriptionPlan.findById(subscription.planId);
    console.log(`✅ Active subscription found: ${plan?.name || 'Unknown'}`);
    console.log(`   Status: ${subscription.status}\n`);

    // Find expired cars
    console.log('🔍 Looking for expired cars...');
    const expiredCars = await Car.find({
      dealerId: dealer._id,
      advertStatus: 'expired'
    });

    if (expiredCars.length === 0) {
      console.log('ℹ️  No expired cars found\n');
      process.exit(0);
    }

    console.log(`📋 Found ${expiredCars.length} expired car(s):\n`);
    expiredCars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model} (${car.year})`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log('');
    });

    // Reactivate cars
    console.log('🔄 Reactivating cars...');
    const result = await Car.updateMany(
      { dealerId: dealer._id, advertStatus: 'expired' },
      { $set: { advertStatus: 'active' } }
    );

    console.log(`✅ Reactivated ${result.modifiedCount} car(s)\n`);

    console.log('✅ REACTIVATION COMPLETE!');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Dealer: ${dealer.businessName}`);
    console.log(`Email: ${dealer.email}`);
    console.log(`Subscription: ${plan?.name || 'Unknown'} (${subscription.status})`);
    console.log(`Cars reactivated: ${result.modifiedCount}`);
    console.log('─────────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide dealer email');
  console.error('Usage: node scripts/reactivateDealerCars.js <dealer-email>');
  process.exit(1);
}

reactivateDealerCars(email);
