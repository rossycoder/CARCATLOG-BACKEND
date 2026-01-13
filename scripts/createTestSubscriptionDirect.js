const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const TradeDealer = require('../models/TradeDealer');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const TradeSubscription = require('../models/TradeSubscription');

/**
 * Create a test subscription directly without Stripe
 * Usage: node backend/scripts/createTestSubscriptionDirect.js <dealer-email> <plan-slug>
 */

async function createTestSubscription() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const dealerEmail = process.argv[2];
    const planSlug = process.argv[3] || 'silver';

    if (!dealerEmail) {
      console.error('❌ Please provide dealer email');
      console.log('Usage: node backend/scripts/createTestSubscriptionDirect.js <dealer-email> <plan-slug>');
      process.exit(1);
    }

    // Find dealer
    const dealer = await TradeDealer.findOne({ email: dealerEmail });
    if (!dealer) {
      console.error(`❌ Dealer not found with email: ${dealerEmail}`);
      process.exit(1);
    }
    console.log(`✅ Found dealer: ${dealer.businessName}`);

    // Find plan
    const plan = await SubscriptionPlan.findOne({ slug: planSlug });
    if (!plan) {
      console.error(`❌ Plan not found with slug: ${planSlug}`);
      process.exit(1);
    }
    console.log(`✅ Found plan: ${plan.name}`);

    // Check if dealer already has subscription
    const existing = await TradeSubscription.findOne({ dealerId: dealer._id, status: 'active' });
    if (existing) {
      console.log('⚠️  Dealer already has active subscription');
      console.log(`   Plan: ${existing.planId}`);
      console.log(`   Status: ${existing.status}`);
      process.exit(0);
    }

    // Create subscription
    const subscription = new TradeSubscription({
      dealerId: dealer._id,
      planId: plan._id,
      stripeSubscriptionId: `test_sub_${Date.now()}`,
      stripeCustomerId: `test_cus_${Date.now()}`,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      listingsLimit: plan.listingLimit,
      listingsUsed: 0
    });

    await subscription.save();
    console.log('✅ Test subscription created:', subscription._id);

    // Update dealer
    dealer.currentSubscriptionId = subscription._id;
    dealer.status = 'active';
    dealer.hasActiveSubscription = true;
    await dealer.save();
    console.log('✅ Dealer updated');

    console.log('\n📊 Subscription Details:');
    console.log(`   ID: ${subscription._id}`);
    console.log(`   Plan: ${plan.name}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Listings Limit: ${subscription.listingsLimit || 'Unlimited'}`);
    console.log(`   Period End: ${subscription.currentPeriodEnd}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Done');
  }
}

createTestSubscription();
