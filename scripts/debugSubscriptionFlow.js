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

const debugFlow = async () => {
  try {
    const TradeSubscription = require('../models/TradeSubscription');
    const TradeDealer = require('../models/TradeDealer');
    const SubscriptionPlan = require('../models/SubscriptionPlan');

    console.log('\n📊 SUBSCRIPTION FLOW DEBUG\n');

    // 1. Check if collections exist
    console.log('1️⃣ Checking collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('   Collections in database:', collectionNames);
    
    const hasTradeSubscriptions = collectionNames.includes('tradesubscriptions');
    const hasTradeDealers = collectionNames.includes('tradedealers');
    const hasSubscriptionPlans = collectionNames.includes('subscriptionplans');
    
    console.log(`   - tradesubscriptions: ${hasTradeSubscriptions ? '✅' : '❌'}`);
    console.log(`   - tradedealers: ${hasTradeDealers ? '✅' : '❌'}`);
    console.log(`   - subscriptionplans: ${hasSubscriptionPlans ? '✅' : '❌'}`);

    // 2. Check if models are properly registered
    console.log('\n2️⃣ Checking model registration...');
    console.log('   TradeSubscription model:', TradeSubscription ? '✅' : '❌');
    console.log('   TradeDealer model:', TradeDealer ? '✅' : '❌');
    console.log('   SubscriptionPlan model:', SubscriptionPlan ? '✅' : '❌');

    // 3. Check schema
    console.log('\n3️⃣ Checking TradeSubscription schema...');
    const schema = TradeSubscription.schema;
    console.log('   Schema paths:', Object.keys(schema.paths).length);
    console.log('   Required fields:', Object.keys(schema.paths).filter(key => {
      const path = schema.paths[key];
      return path.isRequired;
    }));

    // 4. Try to create a test subscription
    console.log('\n4️⃣ Testing subscription creation...');
    
    // Get or create test dealer
    let dealer = await TradeDealer.findOne();
    if (!dealer) {
      console.log('   ❌ No dealers found. Creating test dealer...');
      dealer = new TradeDealer({
        businessName: 'Test Business',
        contactPerson: 'Test Person',
        email: `test-${Date.now()}@test.com`,
        phone: '1234567890',
        password: 'testpassword123',
        status: 'active',
        emailVerified: true
      });
      await dealer.save();
      console.log('   ✅ Test dealer created:', dealer._id);
    } else {
      console.log('   ✅ Found dealer:', dealer.businessName);
    }

    // Get or create test plan
    let plan = await SubscriptionPlan.findOne({ isActive: true });
    if (!plan) {
      console.log('   ❌ No active plans found. Creating test plan...');
      plan = new SubscriptionPlan({
        name: 'Test Plan',
        slug: 'test-plan',
        description: 'Test plan',
        price: 99,
        priceFormatted: '£99.00',
        listingLimit: 10,
        listingLimitDisplay: '10 listings',
        stripePriceId: 'price_test_123',
        features: ['Feature 1'],
        isActive: true
      });
      await plan.save();
      console.log('   ✅ Test plan created:', plan._id);
    } else {
      console.log('   ✅ Found plan:', plan.name);
    }

    // Try to create subscription
    console.log('\n5️⃣ Creating test subscription...');
    const testSub = new TradeSubscription({
      dealerId: dealer._id,
      planId: plan._id,
      stripeSubscriptionId: `test_sub_${Date.now()}`,
      stripeCustomerId: `test_cust_${Date.now()}`,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      listingsLimit: plan.listingLimit,
      listingsUsed: 0
    });

    console.log('   Subscription object created');
    console.log('   - dealerId:', testSub.dealerId);
    console.log('   - planId:', testSub.planId);
    console.log('   - stripeSubscriptionId:', testSub.stripeSubscriptionId);
    console.log('   - status:', testSub.status);

    // Validate before save
    console.log('\n6️⃣ Validating subscription...');
    try {
      await testSub.validate();
      console.log('   ✅ Validation passed');
    } catch (validationError) {
      console.log('   ❌ Validation failed:', validationError.message);
      console.log('   Errors:', validationError.errors);
      throw validationError;
    }

    // Save
    console.log('\n7️⃣ Saving subscription...');
    try {
      const saved = await testSub.save();
      console.log('   ✅ Subscription saved successfully');
      console.log('   - Saved ID:', saved._id);
      console.log('   - Saved at:', saved.createdAt);
    } catch (saveError) {
      console.log('   ❌ Save failed:', saveError.message);
      console.log('   Error code:', saveError.code);
      console.log('   Error details:', saveError);
      throw saveError;
    }

    // Verify it was saved
    console.log('\n8️⃣ Verifying subscription in database...');
    const found = await TradeSubscription.findById(testSub._id);
    if (found) {
      console.log('   ✅ Subscription found in database');
      console.log('   - ID:', found._id);
      console.log('   - Dealer:', found.dealerId);
      console.log('   - Plan:', found.planId);
      console.log('   - Status:', found.status);
    } else {
      console.log('   ❌ Subscription NOT found in database');
    }

    // Count total subscriptions
    console.log('\n9️⃣ Counting subscriptions...');
    const count = await TradeSubscription.countDocuments();
    console.log('   Total subscriptions in database:', count);

    console.log('\n✅ Debug complete\n');
  } catch (error) {
    console.error('\n❌ Debug error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
};

connectDB().then(() => debugFlow());
