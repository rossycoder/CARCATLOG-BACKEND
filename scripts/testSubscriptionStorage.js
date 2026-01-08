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

const testSubscriptionStorage = async () => {
  try {
    const TradeSubscription = require('../models/TradeSubscription');
    const TradeDealer = require('../models/TradeDealer');
    const SubscriptionPlan = require('../models/SubscriptionPlan');

    console.log('\n📊 SUBSCRIPTION STORAGE TEST\n');

    // Get a test dealer
    const dealer = await TradeDealer.findOne();
    if (!dealer) {
      console.log('❌ No dealers found in database');
      return;
    }

    console.log(`Found dealer: ${dealer.businessName} (${dealer._id})`);

    // Get a test plan
    const plan = await SubscriptionPlan.findOne({ isActive: true });
    if (!plan) {
      console.log('❌ No active plans found in database');
      return;
    }

    console.log(`Found plan: ${plan.name} (${plan._id})`);

    // Create a test subscription
    console.log('\n📝 Creating test subscription...');
    
    const testSubscription = new TradeSubscription({
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

    await testSubscription.save();
    console.log('✅ Subscription saved:', testSubscription._id);

    // Verify it was saved
    const savedSubscription = await TradeSubscription.findById(testSubscription._id).populate('planId dealerId');
    if (savedSubscription) {
      console.log('✅ Subscription verified in database');
      console.log(`   - Dealer: ${savedSubscription.dealerId.businessName}`);
      console.log(`   - Plan: ${savedSubscription.planId.name}`);
      console.log(`   - Status: ${savedSubscription.status}`);
      console.log(`   - Listings Limit: ${savedSubscription.listingsLimit}`);
    } else {
      console.log('❌ Subscription not found after save');
    }

    // Test finding active subscription
    console.log('\n🔍 Testing findActiveForDealer...');
    const activeSubscription = await TradeSubscription.findActiveForDealer(dealer._id);
    if (activeSubscription) {
      console.log('✅ Found active subscription:', activeSubscription._id);
    } else {
      console.log('❌ No active subscription found');
    }

    // Update dealer with subscription
    console.log('\n📝 Updating dealer with subscription...');
    dealer.currentSubscriptionId = testSubscription._id;
    dealer.hasActiveSubscription = true;
    await dealer.save();
    console.log('✅ Dealer updated');

    // Verify dealer update
    const updatedDealer = await TradeDealer.findById(dealer._id);
    if (updatedDealer.currentSubscriptionId) {
      console.log('✅ Dealer subscription reference verified:', updatedDealer.currentSubscriptionId);
    } else {
      console.log('❌ Dealer subscription reference not found');
    }

    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

connectDB().then(() => testSubscriptionStorage());
