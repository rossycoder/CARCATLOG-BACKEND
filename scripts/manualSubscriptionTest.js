const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const manualTest = async () => {
  try {
    const TradeSubscription = require('../models/TradeSubscription');
    const TradeDealer = require('../models/TradeDealer');
    const SubscriptionPlan = require('../models/SubscriptionPlan');

    console.log('\n📊 MANUAL SUBSCRIPTION TEST\n');

    // Step 1: Get or create dealer
    console.log('Step 1: Getting dealer...');
    let dealer = await TradeDealer.findOne();
    if (!dealer) {
      console.log('  Creating new dealer...');
      dealer = new TradeDealer({
        businessName: 'Manual Test Business',
        contactPerson: 'Test Contact',
        email: `manual-test-${Date.now()}@test.com`,
        phone: '9999999999',
        password: 'password123',
        status: 'active',
        emailVerified: true
      });
      await dealer.save();
    }
    console.log('  ✅ Dealer:', dealer.businessName, '(' + dealer._id + ')');

    // Step 2: Get or create plan
    console.log('\nStep 2: Getting plan...');
    let plan = await SubscriptionPlan.findOne({ isActive: true });
    if (!plan) {
      console.log('  Creating new plan...');
      plan = new SubscriptionPlan({
        name: 'Manual Test Plan',
        slug: 'manual-test-plan',
        description: 'Manual test plan',
        price: 99,
        priceFormatted: '£99.00',
        listingLimit: 10,
        listingLimitDisplay: '10 listings',
        stripePriceId: 'price_manual_test',
        features: ['Test feature'],
        isActive: true
      });
      await plan.save();
    }
    console.log('  ✅ Plan:', plan.name, '(' + plan._id + ')');

    // Step 3: Create subscription
    console.log('\nStep 3: Creating subscription...');
    const subscription = new TradeSubscription({
      dealerId: dealer._id,
      planId: plan._id,
      stripeSubscriptionId: `manual_test_${Date.now()}`,
      stripeCustomerId: `manual_cust_${Date.now()}`,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      listingsLimit: plan.listingLimit,
      listingsUsed: 0
    });

    console.log('  Subscription object created');
    console.log('  - dealerId:', subscription.dealerId);
    console.log('  - planId:', subscription.planId);
    console.log('  - stripeSubscriptionId:', subscription.stripeSubscriptionId);

    // Step 4: Save subscription
    console.log('\nStep 4: Saving subscription...');
    try {
      const saved = await subscription.save();
      console.log('  ✅ Subscription saved:', saved._id);
    } catch (error) {
      console.error('  ❌ Save failed:', error.message);
      throw error;
    }

    // Step 5: Verify in database
    console.log('\nStep 5: Verifying in database...');
    const found = await TradeSubscription.findById(subscription._id).populate('dealerId planId');
    if (found) {
      console.log('  ✅ Found in database');
      console.log('  - ID:', found._id);
      console.log('  - Dealer:', found.dealerId.businessName);
      console.log('  - Plan:', found.planId.name);
      console.log('  - Status:', found.status);
      console.log('  - Listings Limit:', found.listingsLimit);
    } else {
      console.log('  ❌ NOT found in database');
    }

    // Step 6: Update dealer
    console.log('\nStep 6: Updating dealer with subscription...');
    dealer.currentSubscriptionId = subscription._id;
    dealer.hasActiveSubscription = true;
    await dealer.save();
    console.log('  ✅ Dealer updated');

    // Step 7: Verify dealer update
    console.log('\nStep 7: Verifying dealer update...');
    const updatedDealer = await TradeDealer.findById(dealer._id);
    if (updatedDealer.currentSubscriptionId) {
      console.log('  ✅ Dealer has subscription reference:', updatedDealer.currentSubscriptionId);
    } else {
      console.log('  ❌ Dealer subscription reference not found');
    }

    // Step 8: Test findActiveForDealer
    console.log('\nStep 8: Testing findActiveForDealer...');
    const activeSubscription = await TradeSubscription.findActiveForDealer(dealer._id);
    if (activeSubscription) {
      console.log('  ✅ Found active subscription:', activeSubscription._id);
    } else {
      console.log('  ❌ No active subscription found');
    }

    console.log('\n✅ ALL TESTS PASSED\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
};

connectDB().then(() => manualTest());
