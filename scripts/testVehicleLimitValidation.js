const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Car = require('../models/Car');

async function testVehicleLimitValidation() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    // Find a test dealer
    const dealer = await TradeDealer.findOne().sort({ createdAt: -1 });
    if (!dealer) {
      console.log('No dealers found in database.');
      return;
    }

    console.log('Test Dealer:', dealer.businessName);
    console.log('Dealer ID:', dealer._id);

    // Get dealer's subscription
    const subscription = await TradeSubscription.findActiveForDealer(dealer._id);
    if (!subscription) {
      console.log('\n❌ No active subscription found for dealer');
      return;
    }

    await subscription.populate('planId');
    const plan = subscription.planId;

    console.log('\n=== SUBSCRIPTION INFO ===');
    console.log('Plan:', plan.name);
    console.log('Listing Limit:', plan.listingLimit === null ? 'Unlimited' : plan.listingLimit);
    console.log('Listings Used:', subscription.listingsUsed);
    console.log('Listings Available:', subscription.listingsAvailable);
    console.log('Usage Percentage:', subscription.usagePercentage + '%');

    // Test canAddListing method
    console.log('\n=== TESTING canAddListing() ===');
    const canAdd = subscription.canAddListing();
    console.log('Can add listing:', canAdd.allowed);
    if (!canAdd.allowed) {
      console.log('Reason:', canAdd.reason);
    }

    // Count actual vehicles
    const actualCount = await Car.countDocuments({
      dealerId: dealer._id,
      advertStatus: 'active'
    });

    console.log('\n=== ACTUAL VEHICLE COUNT ===');
    console.log('Active vehicles in database:', actualCount);
    console.log('Subscription listingsUsed:', subscription.listingsUsed);
    
    if (actualCount !== subscription.listingsUsed) {
      console.log('\n⚠️  WARNING: Mismatch detected!');
      console.log('Syncing usage...');
      await subscription.syncUsage();
      console.log('✓ Usage synced. New count:', subscription.listingsUsed);
    } else {
      console.log('✓ Counts match!');
    }

    // Test scenarios
    console.log('\n=== TEST SCENARIOS ===');
    
    if (plan.listingLimit !== null) {
      console.log('\n1. Testing limit enforcement:');
      console.log(`   Limit: ${plan.listingLimit}`);
      console.log(`   Used: ${subscription.listingsUsed}`);
      console.log(`   Available: ${subscription.listingsAvailable}`);
      
      if (subscription.listingsUsed >= plan.listingLimit) {
        console.log('   ✓ At limit - should prevent adding vehicles');
      } else if (subscription.listingsUsed >= plan.listingLimit * 0.8) {
        console.log('   ⚠️  Near limit (80%+) - should show warning');
      } else {
        console.log('   ✓ Below limit - can add vehicles');
      }
    } else {
      console.log('\n1. Unlimited plan - no limits to test');
    }

    // Test increment/decrement
    console.log('\n2. Testing increment/decrement:');
    const originalCount = subscription.listingsUsed;
    console.log(`   Original count: ${originalCount}`);
    
    await subscription.incrementListingCount();
    console.log(`   After increment: ${subscription.listingsUsed}`);
    
    await subscription.decrementListingCount();
    console.log(`   After decrement: ${subscription.listingsUsed}`);
    
    if (subscription.listingsUsed === originalCount) {
      console.log('   ✓ Increment/decrement working correctly');
    } else {
      console.log('   ❌ Count mismatch after operations');
    }

    // Display all plans and their limits
    console.log('\n=== ALL SUBSCRIPTION PLANS ===');
    const allPlans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 });
    allPlans.forEach(p => {
      console.log(`\n${p.name}:`);
      console.log(`  Price: £${(p.price / 100).toFixed(2)}`);
      console.log(`  Listing Limit: ${p.listingLimit === null ? 'Unlimited' : p.listingLimit}`);
      console.log(`  Slug: ${p.slug}`);
    });

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

testVehicleLimitValidation();
