/**
 * Test Trade Subscription Flow
 * Tests the complete trade dealer subscription flow
 * 
 * Usage: node scripts/testTradeSubscription.js [dealer-email]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const TradeSubscription = require('../models/TradeSubscription');

async function testTradeSubscription(dealerEmail) {
  try {
    console.log('🧪 Testing Trade Subscription Flow\n');
    console.log('='.repeat(60));
    
    // Connect to database
    console.log('\n📊 Step 1: Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carcatalog');
    console.log('✅ Database connected');
    
    // Check Stripe configuration
    console.log('\n🔑 Step 2: Checking Stripe configuration...');
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('❌ STRIPE_SECRET_KEY not found in environment');
    }
    
    const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    console.log(`✅ Stripe configured in ${isTestMode ? 'TEST' : 'LIVE'} mode`);
    if (!isTestMode) {
      console.error('❌ WARNING: Using LIVE Stripe keys! This will charge real money!');
      process.exit(1);
    }
    
    // Find or create test dealer
    console.log('\n👤 Step 3: Finding/creating test dealer...');
    const testEmail = dealerEmail || 'test-dealer@example.com';
    
    let dealer = await TradeDealer.findOne({ email: testEmail });
    
    if (!dealer) {
      console.log('📝 Creating test dealer...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test123!', 10);
      
      dealer = new TradeDealer({
        email: testEmail,
        password: hashedPassword,
        businessName: 'Test Motors Ltd',
        contactName: 'Test User',
        phoneNumber: '07700900000',
        address: {
          street: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom'
        },
        isEmailVerified: true,
        status: 'pending'
      });
      
      await dealer.save();
      console.log('✅ Test dealer created:', dealer._id);
    } else {
      console.log('✅ Test dealer found:', dealer._id);
    }
    
    console.log(`   Email: ${dealer.email}`);
    console.log(`   Business: ${dealer.businessName}`);
    console.log(`   Status: ${dealer.status}`);
    
    // Check for existing subscription
    console.log('\n📋 Step 4: Checking existing subscriptions...');
    const existingSubscription = await TradeSubscription.findActiveForDealer(dealer._id);
    
    if (existingSubscription) {
      console.log('⚠️  Dealer already has active subscription:');
      console.log(`   ID: ${existingSubscription._id}`);
      console.log(`   Status: ${existingSubscription.status}`);
      console.log(`   Plan: ${existingSubscription.planId}`);
      console.log(`   Expires: ${existingSubscription.currentPeriodEnd}`);
      console.log('\n   To test subscription, first cancel existing one:');
      console.log(`   node scripts/cancelDealerSubscription.js ${dealer.email}`);
      process.exit(0);
    }
    
    console.log('✅ No active subscription found');
    
    // Check if dealer has used trial
    const hasUsedTrial = await TradeSubscription.findOne({
      dealerId: dealer._id,
      $or: [
        { isTrialing: true },
        { trialEnd: { $exists: true } }
      ]
    });
    
    if (hasUsedTrial) {
      console.log('⚠️  Dealer has already used trial period');
      console.log('   New subscription will be charged immediately');
    } else {
      console.log('✅ Dealer eligible for 30-day FREE trial');
    }
    
    // Get available plans
    console.log('\n📦 Step 5: Getting subscription plans...');
    const plans = await SubscriptionPlan.getActivePlans();
    
    if (plans.length === 0) {
      console.error('❌ No subscription plans found!');
      console.log('\n   Create plans first:');
      console.log('   node scripts/createSubscriptionPlans.js');
      process.exit(1);
    }
    
    console.log(`✅ Found ${plans.length} active plans:`);
    plans.forEach((plan, index) => {
      console.log(`\n   ${index + 1}. ${plan.name}`);
      console.log(`      Price: £${(plan.price / 100).toFixed(2)}/month`);
      console.log(`      Listings: ${plan.listingLimit}`);
      console.log(`      Slug: ${plan.slug}`);
    });
    
    // Select first plan for testing
    const selectedPlan = plans[0];
    console.log(`\n✅ Selected plan for testing: ${selectedPlan.name}`);
    
    // Create Stripe checkout session
    console.log('\n💳 Step 6: Creating Stripe checkout session...');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Create or get Stripe customer
    let customerId = dealer.stripeCustomerId;
    
    if (!customerId || customerId.length < 15 || !customerId.startsWith('cus_')) {
      console.log('📝 Creating Stripe customer...');
      const customer = await stripe.customers.create({
        email: dealer.email,
        name: dealer.businessName,
        metadata: {
          dealerId: dealer._id.toString()
        }
      });
      customerId = customer.id;
      dealer.stripeCustomerId = customerId;
      await dealer.save();
      console.log('✅ Stripe customer created:', customerId);
    } else {
      console.log('✅ Using existing Stripe customer:', customerId);
    }
    
    // Get or create Stripe Price
    let stripePriceId = selectedPlan.stripePriceId;
    
    if (!stripePriceId) {
      console.log('📝 Creating Stripe price...');
      const stripePrice = await stripe.prices.create({
        unit_amount: selectedPlan.price,
        currency: 'gbp',
        recurring: { interval: 'month' },
        product_data: { 
          name: `${selectedPlan.name} Monthly Subscription`,
          description: `${selectedPlan.listingLimit} car listings per month`
        }
      });
      stripePriceId = stripePrice.id;
      selectedPlan.stripePriceId = stripePriceId;
      await selectedPlan.save();
      console.log('✅ Stripe price created:', stripePriceId);
    } else {
      console.log('✅ Using existing Stripe price:', stripePriceId);
    }
    
    // Create checkout session with trial
    const trialDays = hasUsedTrial ? 0 : 30;
    
    const sessionConfig = {
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/trade/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/trade/subscription?cancelled=true`,
      metadata: {
        dealerId: dealer._id.toString(),
        planId: selectedPlan._id.toString(),
        planSlug: selectedPlan.slug
      }
    };
    
    // Add trial if eligible
    if (trialDays > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: trialDays,
        metadata: {
          dealerId: dealer._id.toString(),
          planId: selectedPlan._id.toString()
        }
      };
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('✅ Stripe checkout session created:');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Customer: ${session.customer}`);
    if (trialDays > 0) {
      console.log(`   Trial: ${trialDays} days FREE`);
      console.log(`   After trial: £${(selectedPlan.price / 100).toFixed(2)}/month`);
    } else {
      console.log(`   Price: £${(selectedPlan.price / 100).toFixed(2)}/month (no trial)`);
    }
    
    // Instructions
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 MANUAL TESTING INSTRUCTIONS:\n');
    console.log('1. Open this URL in your browser:');
    console.log(`   ${session.url}\n`);
    console.log('2. Use Stripe test card for SUCCESS:');
    console.log('   Card: 4242 4242 4242 4242');
    console.log('   Expiry: Any future date (e.g., 12/34)');
    console.log('   CVC: Any 3 digits (e.g., 123)');
    console.log('   ZIP: Any 5 digits (e.g., 12345)\n');
    console.log('3. Complete the payment\n');
    if (trialDays > 0) {
      console.log('4. Your card will be saved but NOT charged');
      console.log('   You get 30 days FREE trial');
      console.log(`   After 30 days, Stripe will automatically charge £${(selectedPlan.price / 100).toFixed(2)}\n`);
    } else {
      console.log('4. Your card will be charged immediately');
      console.log(`   Amount: £${(selectedPlan.price / 100).toFixed(2)}\n`);
    }
    console.log('5. Check subscription status:');
    console.log(`   node scripts/checkDealerSubscription.js ${dealer.email}\n`);
    console.log('6. Check webhook events:');
    console.log('   - Go to Stripe Dashboard > Developers > Webhooks');
    console.log('   - Check for events related to this session\n');
    
    console.log('='.repeat(60));
    console.log('\n🧪 Test setup complete! Follow the instructions above.\n');
    
    // Keep connection open
    console.log('⏳ Keeping connection open for 60 seconds...');
    console.log('   (Press Ctrl+C to exit early)\n');
    
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Get dealer email from command line (optional)
const dealerEmail = process.argv[2];

if (dealerEmail && !dealerEmail.includes('@')) {
  console.error('❌ Invalid email format');
  console.log('Usage: node scripts/testTradeSubscription.js [dealer-email]');
  process.exit(1);
}

// Run the test
testTradeSubscription(dealerEmail);
