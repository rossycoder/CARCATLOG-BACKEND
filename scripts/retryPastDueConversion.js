/**
 * Retry Past Due Conversion Script
 * 
 * Past due subscriptions ko retry karne ke liye
 * 
 * Usage:
 *   node backend/scripts/retryPastDueConversion.js daniyalahmadrayan@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function retryPastDueConversion(email) {
  try {
    console.log('\n🔄 RETRY PAST DUE CONVERSION');
    console.log('================================\n');

    if (!email) {
      console.log('❌ Email not provided!');
      console.log('Usage: node backend/scripts/retryPastDueConversion.js <email>\n');
      process.exit(1);
    }

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find dealer
    console.log(`🔍 Looking for dealer: ${email}`);
    const dealer = await TradeDealer.findOne({ email: email });

    if (!dealer) {
      console.log(`❌ Dealer not found!\n`);
      process.exit(1);
    }

    console.log(`✅ Dealer found: ${dealer.businessName}\n`);

    // Find past_due subscription
    console.log('🔍 Looking for past_due subscription...');
    const subscription = await TradeSubscription.findOne({
      dealerId: dealer._id,
      status: 'past_due'
    }).populate('planId');

    if (!subscription) {
      console.log('❌ No past_due subscription found!\n');
      process.exit(1);
    }

    console.log('✅ Past due subscription found!');
    console.log(`   Plan: ${subscription.planId?.name}`);
    console.log(`   Current Status: ${subscription.status}\n`);

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const plan = subscription.planId;
    const planSlug = plan.slug;

    console.log('💳 Starting conversion process...\n');

    // Full monthly prices
    const FULL_PRICES = {
      bronze: 100000, // £1000
      silver: 150000, // £1500
      gold:   200000  // £2000
    };

    // Create or verify Stripe customer
    console.log('👤 Checking Stripe customer...');
    let customerId = dealer.stripeCustomerId || subscription.stripeCustomerId;
    const isValidStripeCustomer = customerId && customerId.startsWith('cus_') && customerId.length > 15;

    if (!isValidStripeCustomer) {
      console.log(`   Creating new Stripe customer...`);
      const customer = await stripe.customers.create({
        email: dealer.email,
        name:  dealer.businessName,
        metadata: { dealerId: dealer._id.toString() }
      });
      customerId = customer.id;
      dealer.stripeCustomerId = customerId;
      await dealer.save();
      console.log(`   ✅ Created: ${customerId}`);
    } else {
      try {
        await stripe.customers.retrieve(customerId);
        console.log(`   ✅ Verified: ${customerId}`);
      } catch (err) {
        console.log(`   ⚠️  Customer not found, creating new...`);
        const customer = await stripe.customers.create({
          email: dealer.email,
          name:  dealer.businessName,
          metadata: { dealerId: dealer._id.toString() }
        });
        customerId = customer.id;
        dealer.stripeCustomerId = customerId;
        await dealer.save();
        console.log(`   ✅ Created: ${customerId}`);
      }
    }

    // Get or create Stripe Price
    console.log('\n💰 Checking Stripe price...');
    let stripePriceId = plan.stripePriceId;
    const fullPricePence = FULL_PRICES[planSlug] || 100000;

    // Always verify price exists in Stripe, create new if not
    let priceExists = false;
    if (stripePriceId) {
      try {
        await stripe.prices.retrieve(stripePriceId);
        priceExists = true;
        console.log(`   ✅ Using existing: ${stripePriceId}`);
      } catch (err) {
        console.log(`   ⚠️  Price not found in Stripe: ${stripePriceId}`);
        priceExists = false;
      }
    }

    if (!priceExists) {
      console.log(`   Creating new price: £${fullPricePence / 100}/month`);
      
      const stripePrice = await stripe.prices.create({
        unit_amount: fullPricePence,
        currency:    'gbp',
        recurring:   { interval: 'month' },
        product_data: { name: `${plan.name} Monthly Subscription` }
      });

      stripePriceId = stripePrice.id;
      plan.stripePriceId = stripePriceId;
      await plan.save();
      console.log(`   ✅ Created: ${stripePriceId}`);
    }

    // Create Stripe subscription
    console.log('\n🔄 Creating Stripe subscription...');
    const stripeSub = await stripe.subscriptions.create({
      customer: customerId,
      items:    [{ price: stripePriceId }],
      metadata: { 
        dealerId: dealer._id.toString(), 
        planId: plan._id.toString(),
        convertedFromTrial: 'true'
      }
    });

    console.log(`✅ Stripe subscription created: ${stripeSub.id}`);
    console.log(`   Status: ${stripeSub.status}`);
    console.log(`   Current period: ${new Date(stripeSub.current_period_start * 1000).toLocaleDateString()} - ${new Date(stripeSub.current_period_end * 1000).toLocaleDateString()}`);

    // Update database
    console.log('\n💾 Updating database...');
    subscription.status = 'active';
    subscription.isTrialing = false;
    subscription.stripeSubscriptionId = stripeSub.id;
    subscription.stripeCustomerId = customerId;
    subscription.currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    console.log('✅ Database updated');

    // Send email
    console.log('\n📧 Sending confirmation email...');
    const EmailService = require('../services/emailService');
    const emailService = new EmailService();
    await emailService.sendSubscriptionRenewed(dealer, subscription);
    console.log('✅ Email sent');

    console.log('\n✅ SUCCESS! Subscription converted!');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Dealer: ${dealer.businessName}`);
    console.log(`Email: ${dealer.email}`);
    console.log(`Plan: ${plan.name}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Stripe Subscription: ${stripeSub.id}`);
    console.log(`Monthly Charge: £${FULL_PRICES[planSlug] / 100}`);
    console.log(`Next Billing: ${new Date(stripeSub.current_period_end * 1000).toLocaleDateString()}`);
    console.log('─────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

const email = process.argv[2];
retryPastDueConversion(email);
